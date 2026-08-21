import mongoose from 'mongoose';
import { UserModel, IUser } from './user.model';
import { PaginationOptions } from '../../types/common.types';

export class UserRepository {
  async create(data: Partial<IUser>): Promise<IUser> {
    const user = new UserModel(data);
    return user.save();
  }

  async findById(id: string, includePassword = false): Promise<IUser | null> {
    const query = UserModel.findOne({
      _id: new mongoose.Types.ObjectId(id),
      deletedAt: null,
    });
    if (includePassword) query.select('+password');
    return query.lean();
  }

  async findByEmail(email: string, includePassword = false): Promise<IUser | null> {
    const query = UserModel.findOne({ email: email.toLowerCase(), deletedAt: null });
    if (includePassword) query.select('+password +refreshTokens');
    return query.lean();
  }

  async findByEmailWithTokens(email: string): Promise<IUser | null> {
    return UserModel.findOne({ email: email.toLowerCase(), deletedAt: null })
      .select('+password +refreshTokens')
      .lean();
  }

  async findAll(
    filter: Record<string, unknown>,
    options: PaginationOptions,
  ): Promise<{ data: IUser[]; total: number }> {
    const sort: Record<string, 1 | -1> = {
      [options.sortBy ?? 'createdAt']: options.sortOrder === 'asc' ? 1 : -1,
    };
    const skip = (options.page - 1) * options.limit;

    const [data, total] = await Promise.all([
      UserModel.find({ ...filter, deletedAt: null })
        .sort(sort)
        .skip(skip)
        .limit(options.limit)
        .lean(),
      UserModel.countDocuments({ ...filter, deletedAt: null }),
    ]);

    return { data, total };
  }

  async updateById(id: string, update: Partial<IUser>): Promise<IUser | null> {
    return UserModel.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id), deletedAt: null },
      { $set: update },
      { new: true, runValidators: true },
    ).lean();
  }

  async softDelete(id: string): Promise<void> {
    await UserModel.findByIdAndUpdate(id, { $set: { deletedAt: new Date(), isActive: false } });
  }

  async addRefreshToken(
    userId: string,
    tokenData: {
      tokenHash: string;
      deviceId: string;
      userAgent: string;
      ip: string;
      expiresAt: Date;
    },
  ): Promise<void> {
    await UserModel.findByIdAndUpdate(userId, {
      $push: {
        refreshTokens: {
          $each: [{ ...tokenData, createdAt: new Date() }],
          $slice: -10, // Keep last 10 devices max
        },
      },
    });
  }

  async removeRefreshToken(userId: string, tokenHash: string): Promise<void> {
    await UserModel.findByIdAndUpdate(userId, {
      $pull: { refreshTokens: { tokenHash } },
    });
  }

  async clearAllRefreshTokens(userId: string): Promise<void> {
    await UserModel.findByIdAndUpdate(userId, { 
      $set: { refreshTokens: [] },
      $inc: { tokenVersion: 1 }
    });
  }

  async findByRefreshTokenHash(tokenHash: string): Promise<IUser | null> {
    return UserModel.findOne({
      'refreshTokens.tokenHash': tokenHash,
      deletedAt: null,
    })
      .select('+refreshTokens')
      .lean();
  }

  async updatePasswordResetToken(
    userId: string,
    tokenHash: string,
    expires: Date,
  ): Promise<void> {
    await UserModel.findByIdAndUpdate(userId, {
      $set: { passwordResetToken: tokenHash, passwordResetExpires: expires },
    });
  }

  async findByPasswordResetToken(tokenHash: string): Promise<IUser | null> {
    return UserModel.findOne({
      passwordResetToken: tokenHash,
      passwordResetExpires: { $gt: new Date() },
      deletedAt: null,
    })
      .select('+password')
      .lean();
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    await UserModel.findByIdAndUpdate(userId, {
      $set: {
        password: hashedPassword,
        passwordResetToken: undefined,
        passwordResetExpires: undefined,
        refreshTokens: [], // Invalidate all sessions on password change
      },
      $inc: { tokenVersion: 1 },
    });
  }

  async toggleFavourite(
    userId: string,
    parkingId: string,
  ): Promise<{ added: boolean }> {
    const user = await UserModel.findById(userId).select('favouriteParkings').lean();
    const lotId = new mongoose.Types.ObjectId(parkingId);
    const isFav = user?.favouriteParkings.some((id) => id.equals(lotId));

    if (isFav) {
      await UserModel.findByIdAndUpdate(userId, { $pull: { favouriteParkings: lotId } });
      return { added: false };
    } else {
      await UserModel.findByIdAndUpdate(userId, { $addToSet: { favouriteParkings: lotId } });
      return { added: true };
    }
  }

  async updateLoginMeta(userId: string, ip: string): Promise<void> {
    await UserModel.findByIdAndUpdate(userId, {
      $set: { lastLoginAt: new Date(), lastLoginIp: ip },
      $inc: { loginCount: 1 },
    });
  }
}

export const userRepository = new UserRepository();
