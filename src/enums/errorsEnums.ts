/**
 * Enum representing different types of errors.
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
 * Enum representing different error messages.
 * @readonly
 */
export enum ErrorMessages {
  WARNING = 'Algo no está del todo bien. Verifica y vuelve a intentar.',
  ERROR = 'Ocurrió un error inesperado.',
  CRITICAL = 'Error crítico. Contacta al soporte técnico.',
  VALIDATION = 'Hay errores en el formulario. Revisa los campos.',
  COMPONENT = 'Error en la carga del componente. Intenta recargar.',
  NETWORK = 'Problema de conexión. Verifica tu internet.',
  AUTHENTICATION = 'No tienes permisos para realizar esta acción.',
  RUNTIME = 'Error de ejecución. Intenta nuevamente.',
  TYPE = 'Tipo de error no identificado.',
  REFERENCE = 'Referencia no válida.',
  SYNTAX = 'Error de sintaxis en el código.',
  RANGE = 'Error en el rango de valores.',
  EVAL = 'Error en la evaluación.',
  URI = 'URI no válida.',
}

/**
 * Enum representing different error styles.
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
 * A record mapping ErrorEnum to their corresponding error messages.
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
 * A record mapping ErrorEnum to their corresponding error styles.
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