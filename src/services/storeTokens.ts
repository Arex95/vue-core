import {
  storeAuthToken,
  storeAuthRefreshToken,
} from "@/services/credentials";
import { LocationPreference } from "@/types";
import { getAppKey } from "@config/global/keyConfig";

/**
 * Encrypts and stores both the access and refresh tokens in the specified storage location.
 * Supports localStorage, sessionStorage, and cookies (with encryption and security options).
 *
 * @param {string} accessToken - The access token to be stored.
 * @param {string} refreshToken - The refresh token to be stored.
 * @param {LocationPreference} persistence - The desired storage location: 'local' for `localStorage`, 'session' for `sessionStorage`, or 'cookie' for cookies.
 * @returns {Promise<void>} A promise that resolves when both tokens have been successfully stored.
 */
export const storeTokens = async (
  accessToken: string,
  refreshToken: string,
  persistence: LocationPreference
): Promise<void> => {
  await storeAuthToken(accessToken, getAppKey(), persistence);
  await storeAuthRefreshToken(refreshToken, getAppKey(), persistence);
};