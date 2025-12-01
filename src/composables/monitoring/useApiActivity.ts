import { useIntervalFn } from "@vueuse/core";
import { getConfiguredAxiosInstance } from "@config/axios";
import { useAuth } from "@composables/auth/useAuth";
import { verifyAuth } from "@/utils";
import { handleError } from "@utils/errors";
import { isServer, getStorage } from "@/utils/ssr";

/**
 * Default session timeout in minutes.
 */
const SESSION_TIMEOUT_MINUTES = 30;

/**
 * Default interval in seconds to check for user activity.
 */
const CHECK_INTERVAL_SECONDS = 60;

/**
 * A composable that monitors API activity to manage session timeouts. It automatically
 * updates an activity timestamp on each outgoing API request and checks periodically
 * if the session has expired due to inactivity. If the session times out, it will
 * automatically log the user out.
 *
 * @param {number} [sessionTimeoutMin=SESSION_TIMEOUT_MINUTES] - The session timeout period in minutes.
 *   Defaults to 30 minutes.
 * @param {number} [checkIntervalSec=CHECK_INTERVAL_SECONDS] - The interval in seconds at which to check for
 *   session expiry. Defaults to 60 seconds.
 * @returns {{
 *   pause: () => void,
 *   resume: () => void,
 *   updateTimestamp: () => void
 * }} An object with functions to control the activity monitoring:
 *   - `pause`: Pauses the periodic session check.
 *   - `resume`: Resumes the periodic session check.
 *   - `updateTimestamp`: Manually updates the last activity timestamp.
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
    if (!isServer) {
      const storage = getStorage();
      storage?.setItem("lastActivity", Date.now().toString());
    }
    handleError("KEEP ALIVE");
  };

  /**
   * Adds an Axios request interceptor to automatically update the activity timestamp
   * on every outgoing API request. The interceptor is added only once.
   */
  const addInterceptor = (): void => {
    if (!interceptorAdded) {
      getConfiguredAxiosInstance().interceptors.request.use((config) => {
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
    const storage = getStorage();
    const lastActivity = storage?.getItem("lastActivity") || null;
    if (!lastActivity) return;

    handleError("CHECK LAST ACTIVITY");
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
    const isAuthenticated = await verifyAuth();
    if (isAuthenticated) {
      await checkTimeout();
      resume();
    } else {
      pause();
    }
  }, checkIntervalSec * 1000);

  (async () => {
    const isAuthenticated = await verifyAuth();
    if (isAuthenticated) {
      await checkTimeout();
      resume();
    } else {
      pause();
    }
  })();

  return { pause, resume, updateTimestamp };
}
