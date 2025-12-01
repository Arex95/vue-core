import { BaseError } from './BaseError';

export class NetworkError extends BaseError {
  readonly code = 'NETWORK_ERROR';
  readonly statusCode?: number;
  readonly originalError?: unknown;

  constructor(
    message: string = 'Network request failed',
    statusCode?: number,
    originalError?: unknown,
    context?: Record<string, any>
  ) {
    super(message, context);
    this.statusCode = statusCode;
    this.originalError = originalError;
  }

  static fromAxiosError(error: any): NetworkError {
    const statusCode = error.response?.status;
    const message = error.response?.data?.message || error.message || 'Network request failed';
    
    return new NetworkError(
      message,
      statusCode,
      error,
      {
        url: error.config?.url,
        method: error.config?.method,
        responseData: error.response?.data,
      }
    );
  }

  static fromFetchError(error: any): NetworkError {
    return new NetworkError(
      error.message || 'Network request failed',
      undefined,
      error,
      {
        cause: error.cause,
      }
    );
  }
}

