import { ErrorType } from '@/types'

export const ERROR_MESSAGES: Record<ErrorType, string> = {
  warning: 'Algo no está del todo bien. Verifica y vuelve a intentar.',
  error: 'Ocurrió un error inesperado.',
  critical: 'Error crítico. Contacta al soporte técnico.',
  validation: 'Hay errores en el formulario. Revisa los campos.',
  component: 'Error en la carga del componente. Intenta recargar.',
  network: 'Problema de conexión. Verifica tu internet.',
  authentication: 'No tienes permisos para realizar esta acción.',
  runtime: 'Error de ejecución. Intenta nuevamente.',
  type: 'Tipo de error no identificado.',
  reference: 'Referencia no válida.',
  syntax: 'Error de sintaxis en el código.',
  range: 'Error en el rango de valores.',
  eval: 'Error en la evaluación.',
  uri: 'URI no válida.',
}

export const ERROR_STYLES: Record<ErrorType, string> = {
  warning: 'color: orange; font-weight: bold;',
  error: 'color: red; font-weight: bold;',
  critical: 'color: white; background-color: red; font-weight: bold; padding: 2px;',
  validation: 'color: blue; font-weight: bold;',
  component: 'color: purple; font-weight: bold;',
  network: 'color: cyan; font-weight: bold;',
  authentication: 'color: brown; font-weight: bold;',
  runtime: 'color: darkred; font-weight: bold;',
  type: 'color: gray; font-weight: bold;',
  reference: 'color: darkorange; font-weight: bold;',
  syntax: 'color: darkblue; font-weight: bold;',
  range: 'color: darkgreen; font-weight: bold;',
  eval: 'color: darkviolet; font-weight: bold;',
  uri: 'color: darkcyan; font-weight: bold;',
}