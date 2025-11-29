import { useRouter } from 'vue-router'
import { ErrorType, ErrorPassMethod } from '@/types'
import { ERROR_MESSAGES, ERROR_STYLES } from '@/enums'

/**
 * Handles and logs errors to the console, with an option to redirect to a dedicated error page.
 * It infers the error type, logs a styled message, and can pass the error message to the error page
 * via query parameters or web storage.
 *
 * @param {unknown} error - The captured error, which can be a string or an `Error` object.
 * @param {boolean} [redirect=false] - If `true`, redirects the user to an error page.
 * @param {string} [route='/error'] - The path to the error page.
 * @param {ErrorPassMethod} [passMethod='query'] - The method to pass the error message to the error route ('query', 'localStorage', 'sessionStorage').
 * @returns {string | undefined} The user-friendly error message, or `undefined` if the error is of an unknown type.
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

  console.log(`%c[${type.toUpperCase()}] ${message}`, ERROR_STYLES[type])

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