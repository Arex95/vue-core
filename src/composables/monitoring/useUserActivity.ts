import { ref, onUnmounted } from 'vue'
import { useEventListener, useTimeoutFn } from '@vueuse/core'

/**
 * A composable to detect user inactivity. It tracks user interactions and triggers a timeout
 * if no activity is detected for a specified duration.
 *
 * @param {number} [timeout=300000] - The time in milliseconds before the user is considered inactive. Defaults to 5 minutes.
 * @param {boolean} [useDefaultEvents=true] - Whether to use the default events (mousemove, keydown, scroll, touchstart) to detect activity.
 * @param {Array<keyof WindowEventMap>} [customEvents=[]] - A list of custom events to detect activity, in addition to the default ones if `useDefaultEvents` is true.
 * @returns {{
 *   isInactive: import('vue').Ref<boolean>,
 *   startInactivityTimer: () => void,
 *   stopInactivityTimer: () => void,
 *   resetInactivityTimer: () => void,
 *   onTimeout: (callback: () => void) => void,
 *   removeTimeoutCallback: (callback: () => void) => void
 * }} An object containing:
 *   - `isInactive`: A ref that becomes `true` when the user is inactive.
 *   - `startInactivityTimer`: A function to start the inactivity timer.
 *   - `stopInactivityTimer`: A function to stop the inactivity timer.
 *   - `resetInactivityTimer`: A function to reset the inactivity timer.
 *   - `onTimeout`: A function to register a callback that will be executed on timeout.
 *   - `removeTimeoutCallback`: A function to remove a previously registered callback.
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