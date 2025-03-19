import { useIntervalFn } from '@vueuse/core'
import { getAxiosInstance } from '@config/axios'
import { useAuth } from '@composables/auth/useAuth'
import { handleError } from '@utils/errors'

const SESSION_TIMEOUT_MINUTES = 30
const CHECK_INTERVAL_SECONDS = 60

export function useApiActivity(sessionTimeoutMin: number, checkIntervalSec: number) {

  const auth = useAuth()
  let interceptorAdded: boolean = false

  const updateTimestamp = () => {
    localStorage.setItem('lastActivity', Date.now().toString())
    handleError('KEEP ALIVE', false)
  }

   const addInterceptor = () => {
    if (!interceptorAdded) {
      getAxiosInstance().interceptors.request.use((config) => {
        updateTimestamp()
        interceptorAdded = true
        return config
      })
    }
  }

  const checkTimeout = () => {
    const lastActivity = localStorage.getItem('lastActivity')
    if (!lastActivity) return
    handleError('CHECK LAST ACTIVITY', false)
    const elapsedMinutes = (Date.now() - Number(lastActivity)) / 60000
    if (elapsedMinutes >= (sessionTimeoutMin || SESSION_TIMEOUT_MINUTES)) {
      auth.logout()
    } else {
      addInterceptor()
    }
  }

  const { pause, resume } = useIntervalFn(() => {
    if (auth.jwt) {
      checkTimeout()
      resume()
    }
  }, (checkIntervalSec || CHECK_INTERVAL_SECONDS) * 1000)

  if (auth.jwt) {
    checkTimeout()
  }

  return { pause, resume, updateTimestamp }
}