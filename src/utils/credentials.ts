import { getTokenConfig } from "@config/global/tokensConfig";
import { getDecryptedItem, storeEncryptedItem } from "@utils/storage";
import { TokensConfig } from "@/types";
import {
  SessionPreference,
  getSessionPersistence,
} from "@config/global/sessionConfig";
import { jwtDecode } from "jwt-decode";
import { handleError } from "@utils/errors";
import { getAppKey } from "@/config";

/**
 * Clears all stored authentication data (access and refresh tokens)
 * from either sessionStorage or localStorage based on the provided preference.
 *
 * @param {SessionPreference} preference - The storage preference ('local' for localStorage, 'session' for sessionStorage).
 * @returns {Promise<void>} A promise that resolves when all relevant storage items are removed.
 */
export const cleanCredentials = async (
  preference: SessionPreference
): Promise<void> => {
  const tokensConfig = getTokenConfig();
  (Object.keys(tokensConfig) as (keyof TokensConfig)[]).forEach((key) => {
    const storage = preference === "local" ? localStorage : sessionStorage;
    storage.removeItem(tokensConfig[key]);
  });
};

/**
 * Retrieves the authentication token (access token) from storage, decrypting it
 * using the provided secret key and based on the specified session preference.
 *
 * @param {string} secretKey - The secret key used for decryption.
 * @param {SessionPreference} preference - The storage preference ('local' for localStorage, 'session' for sessionStorage).
 * @returns {Promise<string | null>} A promise that resolves with the decrypted access token, or null if not found.
 */
export const getAuthToken = async (
  secretKey: string,
  preference: SessionPreference
): Promise<string | null> => {
  const tokensConfig = getTokenConfig();
  return await getDecryptedItem(
    tokensConfig.ACCESS_TOKEN,
    secretKey,
    preference === "local"
  );
};

/**
 * Retrieves the authentication refresh token from storage, decrypting it
 * using the provided secret key and based on the specified session preference.
 *
 * @param {string} secretKey - The secret key used for decryption.
 * @param {SessionPreference} preference - The storage preference ('local' for localStorage, 'session' for sessionStorage).
 * @returns {Promise<string | null>} A promise that resolves with the decrypted refresh token, or null if not found.
 */
export const getAuthRefreshToken = async (
  secretKey: string,
  preference: SessionPreference
): Promise<string | null> => {
  const tokensConfig = getTokenConfig();
  return await getDecryptedItem(
    tokensConfig.REFRESH_TOKEN,
    secretKey,
    preference === "local"
  );
};

/**
 * Stores the authentication token (access token) in storage after encrypting it,
 * based on the specified session preference.
 *
 * @param {string} token - The access token to store.
 * @param {string} secretKey - The secret key used for encryption.
 * @param {SessionPreference} preference - The storage preference ('local' for localStorage, 'session' for sessionStorage).
 * @returns {Promise<void>} A promise that resolves when the token is successfully stored.
 */
export const storeAuthToken = async (
  token: string,
  secretKey: string,
  preference: SessionPreference
): Promise<void> => {
  const tokensConfig = getTokenConfig();
  await storeEncryptedItem(
    tokensConfig.ACCESS_TOKEN,
    token,
    secretKey,
    preference === "local"
  );
};

/**
 * Stores the authentication refresh token in storage after encrypting it,
 * based on the specified session preference.
 *
 * @param {string} token - The refresh token to store.
 * @param {string} secretKey - The secret key used for encryption.
 * @param {SessionPreference} preference - The storage preference ('local' for localStorage, 'session' for sessionStorage).
 * @returns {Promise<void>} A promise that resolves when the token is successfully stored.
 */
export const storeAuthRefreshToken = async (
  token: string,
  secretKey: string,
  preference: SessionPreference
): Promise<void> => {
  const tokensConfig = getTokenConfig();
  await storeEncryptedItem(
    tokensConfig.REFRESH_TOKEN,
    token,
    secretKey,
    preference === "local"
  );
};

/**
 * Verifies the validity and expiration of the current authentication token.
 * If the token is missing, invalid, or expired, appropriate errors are thrown and credentials are cleaned.
 *
 * @param {string} secretKey - The secret key used for token decryption.
 * @param {SessionPreference} preference - The current session persistence preference.
 * @returns {Promise<boolean>} True if the token is valid and unexpired.
 * @throws {Error} "TOKEN_MISSING" if no token is found, "TOKEN_EXPIRED" if the token has expired,
 * "TOKEN_INVALID" if the token format is invalid.
 */
export const verifyAuth = async (): Promise<boolean> => {
  const preference: SessionPreference = getSessionPersistence();
  try {
    const token = await getAuthToken(
      getAppKey(),
      preference
    );
    if (!token) {
      handleError("TOKEN_MISSING: No valid token found", false);
      await cleanCredentials(preference);
      return false;
    }

    const decoded: { exp?: number } = jwtDecode(token);
    const currentTime = Date.now() / 1000;

    if (typeof decoded.exp !== "number") {
      handleError("TOKEN_INVALID: Invalid expiration format", false);
      await cleanCredentials(preference);
      return false;
    }

    if (decoded.exp <= currentTime) {
      handleError("TOKEN_EXPIRED: Token is expired", false);
      await cleanCredentials(preference);
      return false;
    }

    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes("Invalid")) {
      handleError("TOKEN_INVALID: Invalid token format", false);
      await cleanCredentials(preference);
      return false;
    }

    handleError("AUTH_ERROR: An unexpected error occurred", false);
    await cleanCredentials(preference);
    return false;
  }
};
