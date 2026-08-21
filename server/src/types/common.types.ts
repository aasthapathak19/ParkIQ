export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface FindOptions {
  select?: string;
  populate?: string | string[];
  lean?: boolean;
}

export type SortOrder = 'asc' | 'desc';

export interface ApiMeta {
  requestId: string;
  timestamp: string;
  version: string;
  processingTimeMs?: number;
}

export type UserRole = 'customer' | 'owner' | 'admin';

export interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}
