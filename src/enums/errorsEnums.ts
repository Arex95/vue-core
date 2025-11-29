/**
 * An enum that defines a vocabulary of error types, covering a wide range of potential issues
 * from validation and network problems to runtime and syntax errors. This provides a standardized
 * way to classify errors throughout the application.
 * @readonly
 */
export enum ErrorEnum {
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
  VALIDATION = 'validation',
  COMPONENT = 'component',
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  RUNTIME = 'runtime',
  TYPE = 'type',
  REFERENCE = 'reference',
  SYNTAX = 'syntax',
  RANGE = 'range',
  EVAL = 'eval',
  URI = 'uri',
}

/**
 * An enum that provides standardized, user-friendly messages for different error types.
 * These messages are intended to be displayed to the user or used in logs.
 * @readonly
 */
export enum ErrorMessages {
  WARNING = 'Something is not quite right. Please check and try again.',
  ERROR = 'An unexpected error occurred.',
  CRITICAL = 'Critical error. Please contact technical support.',
  VALIDATION = 'There are errors in the form. Please review the fields.',
  COMPONENT = 'Error loading the component. Try reloading.',
  NETWORK = 'Connection problem. Please check your internet.',
  AUTHENTICATION = 'You do not have permission to perform this action.',
  RUNTIME = 'Execution error. Please try again.',
  TYPE = 'Unidentified error type.',
  REFERENCE = 'Invalid reference.',
  SYNTAX = 'Syntax error in the code.',
  RANGE = 'Error in the range of values.',
  EVAL = 'Error in evaluation.',
  URI = 'Invalid URI.',
}

/**
 * An enum that defines CSS styles for console log messages, corresponding to each error type in `ErrorEnum`.
 * This allows for visually distinct, styled logging in the browser's console, making it easier to
 * identify the severity and type of logged errors during development.
 * @readonly
 */
export enum ErrorStyles {
  WARNING = 'color: orange; font-weight: bold;',
  ERROR = 'color: red; font-weight: bold;',
  CRITICAL = 'color: white; background-color: red; font-weight: bold; padding: 2px;',
  VALIDATION = 'color: blue; font-weight: bold;',
  COMPONENT = 'color: purple; font-weight: bold;',
  NETWORK = 'color: cyan; font-weight: bold;',
  AUTHENTICATION = 'color: brown; font-weight: bold;',
  RUNTIME = 'color: darkred; font-weight: bold;',
  TYPE = 'color: gray; font-weight: bold;',
  REFERENCE = 'color: darkorange; font-weight: bold;',
  SYNTAX = 'color: darkblue; font-weight: bold;',
  RANGE = 'color: darkgreen; font-weight: bold;',
  EVAL = 'color: darkviolet; font-weight: bold;',
  URI = 'color: darkcyan; font-weight: bold;',
}

/**
 * A frozen record that maps each `ErrorEnum` member to its corresponding user-friendly message from `ErrorMessages`.
 * This provides a convenient, type-safe way to look up error messages.
 */
export const ERROR_MESSAGES: Record<ErrorEnum, string> = {
  [ErrorEnum.WARNING]: ErrorMessages.WARNING,
  [ErrorEnum.ERROR]: ErrorMessages.ERROR,
  [ErrorEnum.CRITICAL]: ErrorMessages.CRITICAL,
  [ErrorEnum.VALIDATION]: ErrorMessages.VALIDATION,
  [ErrorEnum.COMPONENT]: ErrorMessages.COMPONENT,
  [ErrorEnum.NETWORK]: ErrorMessages.NETWORK,
  [ErrorEnum.AUTHENTICATION]: ErrorMessages.AUTHENTICATION,
  [ErrorEnum.RUNTIME]: ErrorMessages.RUNTIME,
  [ErrorEnum.TYPE]: ErrorMessages.TYPE,
  [ErrorEnum.REFERENCE]: ErrorMessages.REFERENCE,
  [ErrorEnum.SYNTAX]: ErrorMessages.SYNTAX,
  [ErrorEnum.RANGE]: ErrorMessages.RANGE,
  [ErrorEnum.EVAL]: ErrorMessages.EVAL,
  [ErrorEnum.URI]: ErrorMessages.URI,
} as const

/**
 * A frozen record that maps each `ErrorEnum` member to its corresponding CSS style string from `ErrorStyles`.
 * This enables easy retrieval of the correct style for console logging based on the error type.
 */
export const ERROR_STYLES: Record<ErrorEnum, string> = {
  [ErrorEnum.WARNING]: ErrorStyles.WARNING,
  [ErrorEnum.ERROR]: ErrorStyles.ERROR,
  [ErrorEnum.CRITICAL]: ErrorStyles.CRITICAL,
  [ErrorEnum.VALIDATION]: ErrorStyles.VALIDATION,
  [ErrorEnum.COMPONENT]: ErrorStyles.COMPONENT,
  [ErrorEnum.NETWORK]: ErrorStyles.NETWORK,
  [ErrorEnum.AUTHENTICATION]: ErrorStyles.AUTHENTICATION,
  [ErrorEnum.RUNTIME]: ErrorStyles.RUNTIME,
  [ErrorEnum.TYPE]: ErrorStyles.TYPE,
  [ErrorEnum.REFERENCE]: ErrorStyles.REFERENCE,
  [ErrorEnum.SYNTAX]: ErrorStyles.SYNTAX,
  [ErrorEnum.RANGE]: ErrorStyles.RANGE,
  [ErrorEnum.EVAL]: ErrorStyles.EVAL,
  [ErrorEnum.URI]: ErrorStyles.URI,
} as const