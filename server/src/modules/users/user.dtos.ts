export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: 'customer' | 'owner';
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthTokensDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponseDto {
  user: UserResponseDto;
  tokens: AuthTokensDto;
}

export interface UserResponseDto {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: string;
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: Date;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  password: string;
}

export interface UpdateProfileDto {
  name?: string;
  phone?: string;
  avatar?: string;
}
