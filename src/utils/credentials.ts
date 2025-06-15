import { getTokenConfig } from "@config/global/tokensConfig";
import { getDecryptedItem, storeEncryptedItem } from "@utils/storage";
import { TokensConfig } from "@/types";
import { SessionPreference } from "@config/global/sessionConfig";

const tokensConfig = getTokenConfig();

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
  (Object.keys(tokensConfig) as (keyof TokensConfig)[]).forEach((key) => {
    const storage = preference === "session" ? sessionStorage : localStorage;
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
  return await getDecryptedItem(
    tokensConfig.ACCESS_TOKEN,
    secretKey,
    preference === "session"
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
  return await getDecryptedItem(
    tokensConfig.REFRESH_TOKEN,
    secretKey,
    preference === "session"
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
  await storeEncryptedItem(
    tokensConfig.ACCESS_TOKEN,
    token,
    secretKey,
    preference === "session"
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
  await storeEncryptedItem(
    tokensConfig.REFRESH_TOKEN,
    token,
    secretKey,
    preference === "session"
  );
};
