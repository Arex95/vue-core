import type { ErrorType } from "@types/ErrorType";

export function handleError(
  error: string | Error | null | undefined
) {
  // Return early if the error is null or undefined
  if (error == null) {
    return;
  }

  const type: ErrorType = inferErrorType(error);

  /**
   * Infers the error type based on the error object.
   *
   * @param {string | Error} error - The error to classify.
   * @returns {ErrorType} The inferred error type.
   */
  function inferErrorType(error: string | Error): ErrorType {
    if (typeof error === 'string') {
      return 'error';
    }

    if (error.name === 'ValidationError') {
      return 'validation';
    }
    if (error.name === 'NetworkError' || (error.message && error.message.includes('Network'))) {
      return 'network';
    }
    if (error.name === 'AuthenticationError' || (error.message && error.message.includes('Unauthorized'))) {
      return 'authentication';
    }
    if (error.message && error.message.includes('Component')) {
      return 'component';
    }
    if (error.message && error.message.includes('Runtime')) {
      return 'runtime';
    }

    return 'error';
  }

  /**
   * Applies styles to the error message for console output.
   *
   * @param {ErrorType} type - The type of the error.
   * @param {string | Error} error - The error message or object.
   * @returns {string} The styled error message.
   */
  function getStyledMessage(type: ErrorType, error: string | Error): string {
    const message = typeof error === 'string' ? error : error?.message || 'Unknown error';
    const style = 'color: red; font-weight: bold;';
    return `%c[${type.toUpperCase()}] ${message}` + style;
  }
}