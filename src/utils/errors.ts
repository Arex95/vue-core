import { useRouter } from 'vue-router'
import { ErrorType, ErrorPassMethod } from '@/types'
import { ERROR_MESSAGES, ERROR_STYLES } from '@/enums'

/**
 * Maneja y registra errores en la consola, además de permitir redirecciones configurables.
 * @param error - Error capturado (string o Error)
 * @param redirect - `true` si se quiere redirigir a una página de error
 * @param route - Ruta personalizada para la página de error (por defecto: `/error`)
 * @param passMethod - Método para pasar el error a la ruta (`query`, `localStorage`, `sessionStorage`)
 * @returns Mensaje user-friendly del error
 */
export function handleError(
  error: unknown,
  redirect = false,
  route: string = '/error',
  passMethod: ErrorPassMethod = 'query'
) {
  if (!(error instanceof Error)) {
    console.error("Unrecognized error:", error)
    return
  }

  const router = useRouter()
  const type: ErrorType = inferErrorType(error)
  const message = ERROR_MESSAGES[type] || 'Error desconocido.'

  // Mostrar el error en la consola con estilos
  console.log(`%c[${type.toUpperCase()}] ${message}`, ERROR_STYLES[type])

  // Pasar el error según el método elegido
  if (redirect) {
    if (passMethod === 'query') {
      router.push({ path: route, query: { errorMessage: encodeURIComponent(message) } })
    } else if (passMethod === 'localStorage') {
      localStorage.setItem('errorMessage', message)
      router.push(route)
    } else if (passMethod === 'sessionStorage') {
      sessionStorage.setItem('errorMessage', message)
      router.push(route)
    }
  }

  return message
}

/**
 * Infiera el tipo de error basado en su mensaje o nombre.
 * @param error - El error que se desea analizar.
 * @returns El tipo de error determinado.
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