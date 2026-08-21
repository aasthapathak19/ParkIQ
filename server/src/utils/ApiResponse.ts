import { ApiMeta } from '../types/common.types';

interface SuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  pagination?: object;
  metadata: ApiMeta;
}

interface ErrorResponse {
  success: false;
  message: string;
  error: {
    code: string;
    details?: Array<{ field: string; message: string }>;
  };
  metadata: ApiMeta;
}

const buildMeta = (requestId?: string, startTime?: number): ApiMeta => ({
  requestId: requestId ?? 'unknown',
  timestamp: new Date().toISOString(),
  version: 'v1',
  processingTimeMs: startTime ? Date.now() - startTime : undefined,
});

export class ApiResponse {
  static success<T>(
    data: T,
    message = 'Success',
    requestId?: string,
    startTime?: number,
  ): SuccessResponse<T> {
    return {
      success: true,
      message,
      data,
      metadata: buildMeta(requestId, startTime),
    };
  }

  static paginated<T>(
    data: T[],
    pagination: object,
    message = 'Success',
    requestId?: string,
  ): SuccessResponse<T[]> {
    return {
      success: true,
      message,
      data,
      pagination,
      metadata: buildMeta(requestId),
    };
  }

  static error(
    message: string,
    code: string,
    details?: Array<{ field: string; message: string }>,
    requestId?: string,
  ): ErrorResponse {
    return {
      success: false,
      message,
      error: { code, details },
      metadata: buildMeta(requestId),
    };
  }
}
