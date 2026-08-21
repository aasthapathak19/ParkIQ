import { PaginationOptions, PaginatedResult } from '../types/common.types';

export const parsePaginationParams = (query: Record<string, string | undefined>): PaginationOptions => {
  const page = Math.max(1, parseInt(query.page ?? '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '20', 10)));
  const sortBy = query.sortBy ?? 'createdAt';
  const sortOrder = (query.sortOrder === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc';
  return { page, limit, sortBy, sortOrder };
};

export const buildPaginatedResult = <T>(
  data: T[],
  total: number,
  options: PaginationOptions,
): PaginatedResult<T> => {
  const totalPages = Math.ceil(total / options.limit);
  return {
    data,
    pagination: {
      page: options.page,
      limit: options.limit,
      total,
      totalPages,
      hasNextPage: options.page < totalPages,
      hasPrevPage: options.page > 1,
    },
  };
};

export const buildMongoSort = (
  sortBy: string,
  sortOrder: 'asc' | 'desc',
): Record<string, 1 | -1> => {
  return { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
};
