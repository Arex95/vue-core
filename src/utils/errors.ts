import { ErrorType } from '@/types'
import { ERROR_MESSAGES, ERROR_STYLES } from '@/enums'
import { BaseError, NetworkError, AuthError, ValidationError, ServerError } from '@/errors'

export interface ErrorInfo {
  message: string;
  type: ErrorType;
  errorData?: Record<string, unknown>;
}

/**
 * Handles and logs errors to the console. Supports both standard Error objects and custom error classes
 * (BaseError, NetworkError, etc.). It infers the error type, logs a styled message with detailed information,
 * and returns structured error information for further handling.
 *
 * @param {unknown} error - The captured error, which can be a string, Error object, or custom error class.
 * @returns {ErrorInfo | undefined} An object containing the error message, type, and additional error data,
 *   or `undefined` if the error is not an Error instance.
 *
 * @example
 * ```typescript
 * try {
 *   await someOperation();
 * } catch (error) {
 *   const errorInfo = handleError(error);
 *   if (errorInfo) {
 *     // Use errorInfo.message, errorInfo.type, errorInfo.errorData
 *     // Handle redirect or other actions as needed
 *   }
 * }
 * ```
 */
export function handleError(error: unknown): ErrorInfo | undefined {
  if (!(error instanceof Error)) {
    console.error("Unrecognized error:", error)
    return undefined
  }

  let type: ErrorType;
  let message: string;
  let errorData: Record<string, unknown> | undefined = undefined;

  if (error instanceof BaseError) {
    type = inferErrorTypeFromBaseError(error);
    message = error.message || ERROR_MESSAGES[type] || 'Error desconocido.';
    errorData = {
      code: error.code,
      statusCode: error.statusCode,
      context: error.context,
      timestamp: error.timestamp,
    };

    if (error instanceof ValidationError && error.issues.length > 0) {
      errorData.issues = error.issues;
    }
  } else {
    type = inferErrorType(error);
    message = ERROR_MESSAGES[type] || error.message || 'Error desconocido.';
  }

  const logMessage = `%c[${type.toUpperCase()}] ${message}`;
  const logStyle = ERROR_STYLES[type] || ERROR_STYLES.error;

  console.group(logMessage, logStyle);
  console.error('Error details:', error);
  if (errorData) {
    console.error('Error data:', errorData);
  }
  if (error.stack) {
    console.error('Stack trace:', error.stack);
  }
  console.groupEnd();

  return {
    message,
    type,
    ...(errorData && { errorData }),
  };
}

function inferErrorTypeFromBaseError(error: BaseError): ErrorType {
  if (error instanceof NetworkError) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      return 'authentication';
    }
    return 'network';
  }
  if (error instanceof AuthError) {
    return 'authentication';
  }
  if (error instanceof ValidationError) {
    return 'validation';
  }
  if (error instanceof ServerError) {
    if (error.statusCode >= 500) {
      return 'critical';
    }
    return 'error';
  }
  return 'error';
}

/**
 * Infers the `ErrorType` of an error by analyzing its name and message content.
 * This helps in categorizing the error for standardized handling and logging.
 *
 * @param {string | Error} error - The error to analyze.
 * @returns {ErrorType} The inferred error type.
 */
function inferErrorType(error: string | Error): ErrorType {
  const msg = typeof error === 'string' ? error : error.message

  if (typeof error === 'string') return 'error'
  if (error.name === 'ValidationError') return 'validation'
  if (error.name === 'NetworkError' || msg.includes('Network')) return 'network'
  if (error.name === 'AuthenticationError' || msg.includes('Unauthorized')) return 'authentication'
  if (msg.includes('Component')) return 'component'
  if (msg.includes('Runtime')) return 'runtime'

  return 'error'
}