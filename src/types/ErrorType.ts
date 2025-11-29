/**
 * Defines a union type of allowed error categories. This provides a standardized set of
 * error types that can be used throughout the application for consistent error handling and logging.
 */
export type ErrorType =
  | 'warning'
  | 'error'
  | 'critical'
  | 'validation'
  | 'component'
  | 'network'
  | 'authentication'
  | 'runtime'
  | 'type'
  | 'reference'
  | 'syntax'
  | 'range'
  | 'eval'
  | 'uri';

/**
 * Defines the available methods for passing error information between routes or components.
 * This can be done via URL query parameters, or by using `localStorage` or `sessionStorage`.
 */
export type ErrorPassMethod = 'query' | 'localStorage' | 'sessionStorage';