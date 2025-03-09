/**
 * Tipos de errores permitidos
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

/**
 * Métodos disponibles para pasar errores a la ruta
 */
export type ErrorPassMethod = 'query' | 'localStorage' | 'sessionStorage'