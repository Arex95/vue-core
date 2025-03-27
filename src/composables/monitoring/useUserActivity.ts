import { ref, onUnmounted } from 'vue'
import { useEventListener, useTimeoutFn } from '@vueuse/core'

/**
 * Hook para detectar la inactividad del usuario.
 * @param timeout - Tiempo en milisegundos antes de considerar al usuario inactivo. Por defecto es 5 minutos.
 * @param useDefaultEvents - Si se deben usar los eventos por defecto (mousemove, keydown, scroll, touchstart).
 * @param customEvents - Lista personalizada de eventos para detectar actividad.
 * @returns Un objeto con el estado de inactividad, funciones para controlar el temporizador y registrar callbacks.
 */
export function useUserInactivity(
  timeout = 300000,
  useDefaultEvents = true,
  customEvents: Array<keyof WindowEventMap> = []
) {
  const isInactive = ref(false)
  const callbacks: Array<() => void> = []

  const { start, stop } = useTimeoutFn(() => {
    isInactive.value = true
    callbacks.forEach(cb => cb())
  }, timeout, { immediate: false })

  const resetInactivityTimer = () => {
    isInactive.value = false
    stop()
    start()
  }

  const startInactivityTimer = () => {
    isInactive.value = false
    start()
  }

  const stopInactivityTimer = () => {
    stop()
    isInactive.value = false
  }

  const onTimeout = (callback: () => void) => {
    if (typeof callback !== 'function') {
      console.error('El callback proporcionado no es una función')
      return
    }
    callbacks.push(callback)
  }

  const removeTimeoutCallback = (callback: () => void) => {
    const index = callbacks.indexOf(callback)
    if (index !== -1) {
      callbacks.splice(index, 1)
    }
  }

  const events: Array<keyof WindowEventMap> = useDefaultEvents
    ? ['mousemove', 'keydown', 'scroll', 'touchstart', ...customEvents]
    : customEvents

  events.forEach(event => {
    useEventListener(event, resetInactivityTimer)
  })

  onUnmounted(() => stopInactivityTimer())

  return {
    isInactive,
    startInactivityTimer,
    stopInactivityTimer,
    resetInactivityTimer,
    onTimeout,
    removeTimeoutCallback
  }
}