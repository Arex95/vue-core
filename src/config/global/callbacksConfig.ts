export interface CallbacksConfig {
  onRefreshFailed?: () => void;
  onLogout?: () => void;
}

let callbacksConfig: CallbacksConfig = {};

/**
 * Configures the lifecycle callbacks for auth events.
 * @param {CallbacksConfig} config - Callbacks to invoke on refresh failure or logout.
 */
export const configCallbacks = (config: CallbacksConfig): void => {
  callbacksConfig = { ...config };
};

/**
 * Returns the configured lifecycle callbacks.
 * @returns {CallbacksConfig}
 */
export const getCallbacksConfig = (): CallbacksConfig => callbacksConfig;
