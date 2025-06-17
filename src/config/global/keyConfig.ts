import { AppKeyConfig } from "../../types/AppKeyConfig";

let appKey: string | null = null;

/**
 * Sets the main application encryption key.
 * This key is expected to be used for encryption purposes within the application.
 *
 * @param {AppKeyConfig} config - An object containing the application encryption key.
 * @param {string} config.key - The new application encryption key.
 *
 * @returns {void} Does not return anything, but updates the application key.
 * @throws {Error} If the provided key is null, undefined, or an empty string.
 */
export function configAppKey(config: AppKeyConfig): void {
  if (!config || !config.appKey || config.appKey.trim() === "") {
    throw new Error("The application encryption key cannot be null or empty.");
  }
  appKey = config.appKey;
}

/**
 * Retrieves the current application encryption key.
 * Throws an error if the application key has not been configured.
 *
 * @returns {string} The configured application encryption key.
 * @throws {Error} If the application encryption key has not been set.
 */
export function getAppKey(): string {
  if (appKey === null) {
    throw new Error(
      "The application encryption key has not been configured. Please call 'configAppKey()' before attempting to access it."
    );
  }
  return appKey;
}
