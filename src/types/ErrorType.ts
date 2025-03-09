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
  | 'type'
  | 'reference'
  | 'syntax'
  | 'range'
  | 'eval'
  | 'uri';

/**
 * Métodos disponibles para pasar errores a la ruta
 */
export type ErrorPassMethod = 'query' | 'localStorage' | 'sessionStorage'