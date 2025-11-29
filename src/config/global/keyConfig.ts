import { AppKeyConfig } from "../../types/AppKeyConfig";

let appKey: string | null = null;

/**
 * Sets the main application key, which is intended for use in encryption and signing operations.
 * This function should be called once at application startup to configure the key.
 *
 * @param {AppKeyConfig} config - An object containing the application key.
 * @param {string} config.appKey - The application key.
 * @throws {Error} If the provided key is null, undefined, or an empty string.
 */
export function configAppKey(config: AppKeyConfig): void {
  if (!config || !config.appKey || config.appKey.trim() === "") {
    throw new Error("The application encryption key cannot be null or empty.");
  }
  appKey = config.appKey;
}

/**
 * Retrieves the configured application key.
 *
 * @returns {string} The configured application key.
 * @throws {Error} If the application key has not been set by calling `configAppKey` first.
 */
export function getAppKey(): string {
  if (appKey === null) {
    throw new Error(
      "The application encryption key has not been configured. Please call 'configAppKey()' before attempting to access it."
    );
  }
  return appKey;
}
