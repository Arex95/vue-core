import { getTokenConfig } from "@config/global/tokensConfig";
import { getDecryptedItem, storeEncryptedItem } from "@utils/storage";
import { TokensConfig } from "@/types";
import {
  getSessionPersistence,
} from "@config/global/sessionConfig";
import { SessionPreference } from "@/types/SessionConfig"
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
 * @returns {Promise<boolean>} True if the token is valid and unexpired.
 * @throws {Error} "TOKEN_MISSING" if no token is found, "TOKEN_EXPIRED" if the token has expired,
 * "TOKEN_INVALID" if the token format is invalid.
 */
export const verifyAuth = async (): Promise<boolean> => {
  const sessionPersistence = await getSessionPersistence();

  const handleAuthError = async (message: string, shouldClean: boolean = true) => {
    handleError(message, false);
    if (shouldClean) {
      await cleanCredentials(sessionPersistence);
    }
    return false;
  };

  try {
    const token = await getAuthToken(getAppKey(), sessionPersistence);
    if (!token) {
      return await handleAuthError("TOKEN_MISSING: No valid token found");
    }

    let decoded: { exp?: number };
    try {
      decoded = jwtDecode(token);
    } catch (decodeError) {
      return await handleAuthError("TOKEN_INVALID: Invalid token format");
    }

    const currentTime = Date.now() / 1000;

    if (typeof decoded.exp !== "number") {
      return await handleAuthError("TOKEN_INVALID: Invalid expiration format");
    }

    if (decoded.exp <= currentTime) {
      return await handleAuthError("TOKEN_EXPIRED: Token is expired");
    }

    return true;
  } catch (error) {
    return await handleAuthError("AUTH_ERROR: An unexpected error occurred", true);
  }
};
