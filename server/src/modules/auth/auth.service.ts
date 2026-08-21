import { v4 as uuidv4 } from 'uuid';
import { userRepository } from '../users/user.repository';
import { IUser } from '../users/user.model';
import {
  RegisterDto, LoginDto, AuthResponseDto, UserResponseDto,
  UpdateProfileDto, AuthTokensDto,
} from '../users/user.dtos';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt.utils';
import { hashPassword, comparePassword, hashToken, generateSecureToken } from '../../utils/crypto.utils';
import {
  ConflictError, UnauthorizedError, NotFoundError, ForbiddenError,
} from '../../domain/errors';
import { env } from '../../config/env';

export class AuthService {
  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await userRepository.findByEmail(dto.email);
    if (existing) throw new ConflictError('An account with this email already exists');

    const hashedPassword = await hashPassword(dto.password);
    const user = await userRepository.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      phone: dto.phone,
      role: dto.role ?? 'customer',
    });

    const tokens = await this.issueTokens(user, '::1');
    return { user: this.toResponseDto(user), tokens };
  }

  async login(dto: LoginDto, ip: string, userAgent: string): Promise<AuthResponseDto> {
    const user = await userRepository.findByEmailWithTokens(dto.email);
    if (!user) throw new UnauthorizedError('Invalid email or password');
    if (!user.isActive) throw new ForbiddenError('Your account has been deactivated');
    if (user.isSuspended) throw new ForbiddenError(`Account suspended: ${user.suspensionReason}`);

    const isMatch = await comparePassword(dto.password, user.password);
    if (!isMatch) throw new UnauthorizedError('Invalid email or password');

    await userRepository.updateLoginMeta(user._id.toString(), ip);

    const tokens = await this.issueTokens(user, ip, userAgent);
    return { user: this.toResponseDto(user), tokens };
  }

  async logout(userId: string, refreshToken: string, accessToken?: string): Promise<void> {
    const tokenHash = hashToken(refreshToken);
    await userRepository.removeRefreshToken(userId, tokenHash);
    
    // Blacklist access token in Redis until it expires naturally
    if (accessToken) {
      const redisClient = require('../../infrastructure/redis/RedisClient').redisClient;
      await redisClient.set(`blacklist:${accessToken}`, 'revoked', 'EX', 15 * 60); // 15 mins matching JWT TTL
    }
  }

  async logoutAll(userId: string): Promise<void> {
    await userRepository.clearAllRefreshTokens(userId);
    // Note: To fully revoke all active access tokens for this user instantly,
    // we would check tokenVersion in auth middleware. For Phase 2, tokenVersion is incremented.
  }

  async refreshTokens(rawRefreshToken: string, ip: string): Promise<AuthTokensDto> {
    let payload;
    try {
      payload = verifyRefreshToken(rawRefreshToken);
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const tokenHash = hashToken(rawRefreshToken);
    const user = await userRepository.findByRefreshTokenHash(tokenHash);
    if (!user) throw new UnauthorizedError('Refresh token has been revoked');

    const tokenEntry = user.refreshTokens?.find((t) => t.tokenHash === tokenHash);
    if (!tokenEntry || tokenEntry.expiresAt < new Date()) {
      throw new UnauthorizedError('Refresh token has expired');
    }

    // Rotate: remove old, issue new
    await userRepository.removeRefreshToken(user._id.toString(), tokenHash);
    return this.issueTokens(user, ip);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await userRepository.findByEmail(email);
    // Never reveal whether email exists
    if (!user) return;

    const token = generateSecureToken();
    const tokenHash = hashToken(token);
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await userRepository.updatePasswordResetToken(user._id.toString(), tokenHash, expires);

    // TODO Phase 2: EmailChannel.send({ to: email, token, type: 'password_reset' })
    // For Phase 1: log the token (dev only)
    if (env.NODE_ENV === 'development') {
      console.log(`[DEV] Password reset token for ${email}: ${token}`);
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = hashToken(token);
    const user = await userRepository.findByPasswordResetToken(tokenHash);
    if (!user) throw new UnauthorizedError('Invalid or expired reset token');

    const hashed = await hashPassword(newPassword);
    await userRepository.updatePassword(user._id.toString(), hashed);
  }

  private async issueTokens(
    user: IUser,
    ip: string,
    userAgent = '',
  ): Promise<AuthTokensDto> {
    const payload = { id: user._id.toString(), email: user.email, role: user.role };
    const accessToken = signAccessToken(payload);
    const rawRefreshToken = generateSecureToken(40);
    const tokenHash = hashToken(rawRefreshToken);
    const deviceId = uuidv4();

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await userRepository.addRefreshToken(user._id.toString(), {
      tokenHash,
      deviceId,
      userAgent,
      ip,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
    };
  }

  toResponseDto(user: IUser): UserResponseDto {
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }
}

export const authService = new AuthService();
