import { getTokenConfig } from "@config/global/tokensConfig";
import { getDecryptedItem, storeEncryptedItem } from "@utils/storage";
import { TokensConfig } from "@/types";
import {
  getSessionPersistence,
} from "@config/global/sessionConfig";
import { LocationPreference } from "@/types/SessionConfig"
import { jwtDecode } from "jwt-decode";
import { handleError } from "@utils/errors";
import { getAppKey } from "@/config/global";

/**
 * Removes all stored authentication credentials (access and refresh tokens) from the specified storage locations.
 *
 * @param {LocationPreference} location - The storage location to clear. Can be 'local' for `localStorage`,
 *   'session' for `sessionStorage`, or 'any' to clear both.
 * @returns {Promise<void>} A promise that resolves when the credentials have been cleared.
 */
export const cleanCredentials = async (
  location: LocationPreference
): Promise<void> => {
  const tokensConfig = getTokenConfig();

  (Object.keys(tokensConfig) as (keyof TokensConfig)[]).forEach((key) => {
    const itemKey = tokensConfig[key];

    if (location === "local" || location === "any") {
      localStorage.removeItem(itemKey);
    }

    if (location === "session" || location === "any") {
      sessionStorage.removeItem(itemKey);
    }
  });
};

/**
 * Retrieves and decrypts the access token from the specified storage location.
 *
 * @param {string} secretKey - The secret key to use for decryption.
 * @param {LocationPreference} location - The storage location to search ('local', 'session', or 'any').
 * @returns {Promise<string | null>} A promise that resolves with the decrypted access token, or `null` if it's not found.
 */
export const getAuthToken = async (
  secretKey: string,
  location: LocationPreference
): Promise<string | null> => {
  const tokensConfig = getTokenConfig();
  return await getDecryptedItem(
    tokensConfig.ACCESS_TOKEN,
    secretKey,
    location
  );
};

/**
 * Retrieves and decrypts the refresh token from the specified storage location.
 *
 * @param {string} secretKey - The secret key to use for decryption.
 * @param {LocationPreference} location - The storage location to search ('local', 'session', or 'any').
 * @returns {Promise<string | null>} A promise that resolves with the decrypted refresh token, or `null` if it's not found.
 */
export const getAuthRefreshToken = async (
  secretKey: string,
  location: LocationPreference
): Promise<string | null> => {
  const tokensConfig = getTokenConfig();
  return await getDecryptedItem(
    tokensConfig.REFRESH_TOKEN,
    secretKey,
    location
  );
};

/**
 * Encrypts and stores the access token in the specified storage location.
 *
 * @param {string} token - The access token to store.
 * @param {string} secretKey - The secret key to use for encryption.
 * @param {LocationPreference} location - The storage location ('local' or 'session').
 * @returns {Promise<void>} A promise that resolves when the token has been stored.
 */
export const storeAuthToken = async (
  token: string,
  secretKey: string,
  location: LocationPreference
): Promise<void> => {
  const tokensConfig = getTokenConfig();
  await storeEncryptedItem(
    tokensConfig.ACCESS_TOKEN,
    token,
    secretKey,
    location
  );
};

/**
 * Encrypts and stores the refresh token in the specified storage location.
 *
 * @param {string} token - The refresh token to store.
 * @param {string} secretKey - The secret key to use for encryption.
 * @param {LocationPreference} location - The storage location ('local' or 'session').
 * @returns {Promise<void>} A promise that resolves when the token has been stored.
 */
export const storeAuthRefreshToken = async (
  token: string,
  secretKey: string,
  location: LocationPreference
): Promise<void> => {
  const tokensConfig = getTokenConfig();
  await storeEncryptedItem(
    tokensConfig.REFRESH_TOKEN,
    token,
    secretKey,
    location
  );
};

/**
 * Verifies the current user's authentication status by checking for a valid, unexpired access token.
 * It searches for the token in both `localStorage` and `sessionStorage`. If the token is missing,
 * malformed, or expired, it logs the issue, clears credentials, and returns `false`.
 *
 * @returns {Promise<boolean>} A promise that resolves to `true` if the user is authenticated, and `false` otherwise.
 */
export const verifyAuth = async (): Promise<boolean> => {
  const sessionPersistence ='any';

  const handleAuthError = async (message: string, shouldClean: boolean = true) => {
    handleError(message, false);
    if (shouldClean) {
      await cleanCredentials(sessionPersistence);
    }
    return false;
  };

  const token = await getAuthToken(getAppKey(), sessionPersistence);
  if (!token) {
    return handleAuthError("TOKEN_MISSING: No valid token found");
  }

  try {
    const decoded: { exp?: number } = jwtDecode(token);
    const currentTime = Date.now() / 1000;

    if (typeof decoded.exp !== "number") {
      return handleAuthError("TOKEN_INVALID: Invalid expiration format");
    }

    if (decoded.exp <= currentTime) {
      return handleAuthError("TOKEN_EXPIRED: Token is expired");
    }

    return true;
  } catch (error) {
    return handleAuthError("TOKEN_INVALID: Invalid token format");
  }
};
