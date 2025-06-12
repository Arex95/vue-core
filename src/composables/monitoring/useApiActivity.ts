import { useIntervalFn } from "@vueuse/core";
import { getAxiosInstance } from "@config/axios";
import { useAuth } from "@composables/auth/useAuth";
import { handleError } from "@utils/errors";

/**
 * Default session timeout in minutes.
 */
const SESSION_TIMEOUT_MINUTES = 30;

/**
 * Default interval in seconds to check for user activity.
 */
const CHECK_INTERVAL_SECONDS = 60;

/**
 * A Vue composable to monitor API activity and manage session timeouts.
 * It tracks the last user activity and automatically logs out the user
 * if no activity is detected within a specified timeout.
 * @param {number} [sessionTimeoutMin=SESSION_TIMEOUT_MINUTES] - The time in minutes after which an inactive session will time out.
 * @param {number} [checkIntervalSec=CHECK_INTERVAL_SECONDS] - The interval in seconds at which the session timeout is checked.
 * @returns {object} An object containing methods to pause, resume, and manually update the activity timestamp.
 */
export function useApiActivity(
  sessionTimeoutMin: number = SESSION_TIMEOUT_MINUTES,
  checkIntervalSec: number = CHECK_INTERVAL_SECONDS
) {
  const auth = useAuth();
  let interceptorAdded: boolean = false;

  /**
   * Updates the 'lastActivity' timestamp in localStorage to the current time.
   * This function should be called on any user activity.
   */
  const updateTimestamp = (): void => {
    localStorage.setItem("lastActivity", Date.now().toString());
    handleError("KEEP ALIVE", false);
  };

  /**
   * Adds an Axios request interceptor to automatically update the activity timestamp
   * on every outgoing API request. The interceptor is added only once.
   */
  const addInterceptor = (): void => {
    if (!interceptorAdded) {
      getAxiosInstance().interceptors.request.use((config) => {
        updateTimestamp();
        interceptorAdded = true;
        return config;
      });
    }
  };

  /**
   * Checks if the current session has timed out due to inactivity.
   * If timed out, it performs a logout.
   */
  const checkTimeout = async (): Promise<void> => {
    const lastActivity = localStorage.getItem("lastActivity");
    if (!lastActivity) return;

    handleError("CHECK LAST ACTIVITY", false);
    const elapsedMinutes = (Date.now() - Number(lastActivity)) / 60000;

    if (elapsedMinutes >= sessionTimeoutMin) {
      await auth.logout();
    } else {
      addInterceptor();
    }
  };

  /**
   * Configures and starts an interval to periodically check the session timeout.
   * The interval only runs if a JWT is present, ensuring activity checks are relevant.
   */
  const { pause, resume } = useIntervalFn(async () => {
    const currentJwt = await auth.getJwt();
    if (currentJwt) {
      await checkTimeout();
      resume();
    } else {
      pause();
    }
  }, checkIntervalSec * 1000);

  (async () => {
    const currentJwt = await auth.getJwt();
    if (currentJwt) {
      await checkTimeout();
      resume();
    } else {
      pause();
    }
  })();

  return { pause, resume, updateTimestamp };
}
