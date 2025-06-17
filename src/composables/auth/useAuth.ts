import { getAxiosInstance } from "@config/axios";
import { getEndpointsConfig } from "@config/global/endpointsConfig";
import { handleError } from "@utils/errors";
import {
  getAuthRefreshToken,
  storeAuthToken,
  storeAuthRefreshToken,
  cleanCredentials,
} from "@utils/credentials";
import { AuthParams, AuthResponse } from "@/types";

import {
  configSession,
  getSessionPersistencePreference,
  SessionPreference,
} from "@config/global/sessionConfig";
import { getSecretKey } from "@/config";

/**
 * @typedef {object} AuthHook
 * @property {function(): Promise<number | null>} getTokenExpiry - Retrieves the expiration time of the current token in milliseconds.
 * @property {function(): Promise<void>} cleanCredentials - Clears authentication credentials from storage.
 * @property {(params?: AuthParams) => Promise<void>} logout - Logs out the user, clears credentials, and reloads the page.
 * @property {(params: AuthParams, persistence: SessionPreference) => Promise<AuthResponse>} login - Logs in the user and stores tokens.
 * @property {function(): Promise<AuthResponse>} refresh - Refreshes authentication tokens.
 * @property {function(): Promise<boolean>} verifyAuth - Verifies the validity and expiration of the current authentication token.
 * @property {(preference: SessionPreference) => void} setSessionPersistencePreference - Sets the user's preferred storage for authentication data.
 * @property {function(): SessionPreference} getSessionPersistencePreference - Retrieves the user's current preferred storage for authentication data.
 */

/**
 * Custom hook for authentication logic, including login, logout, token management, and session preference.
 *
 * @param {string} secretKey - The secret key used for token encryption/decryption.
 * @returns {AuthHook} An object containing authentication functions.
 */
export function useAuth(secretKey: string = getSecretKey()) {
  const axiosInstance = getAxiosInstance();
  const endpoints = getEndpointsConfig();
  const currentPersistencePreference: SessionPreference =
    getSessionPersistencePreference();

  /**
   * Logs out the user by making a POST request to the logout endpoint,
   * cleaning all stored credentials, and reloading the page.
   * The session persistence preference is NOT reset here; it persists across logouts.
   *
   * @param {AuthParams} [params={}] - Optional parameters to send with the logout request.
   * @returns {Promise<void>}
   */
  const logout = async (params: AuthParams = {}): Promise<void> => {
    try {
      await axiosInstance.post(endpoints.LOGOUT, params);
    } catch (error) {
      handleError(error, false);
    } finally {
      await cleanCredentials(currentPersistencePreference);
      window.location.reload();
    }
  };

  /**
   * Authenticates the user by making a POST request to the login endpoint,
   * stores the received access and refresh tokens, and sets the session persistence preference.
   *
   * @param {AuthParams} params - The authentication parameters (e.g., username, password).
   * @param {SessionPreference} persistence - The storage preference: 'local' for localStorage, 'session' for sessionStorage.
   * @returns {Promise<AuthResponse>} The authentication response containing tokens and user information.
   * @throws {Error} If the login request fails.
   */
  const login = async (
    params: AuthParams,
    persistence: SessionPreference
  ): Promise<AuthResponse> => {
    try {
      const { data } = await axiosInstance.post<AuthResponse>(
        endpoints.LOGIN,
        params
      );

      if (!data) {
        throw new Error("LOGIN_ERROR: No data received from login endpoint.");
      }

      if (!data.access_token) {
        throw new Error("LOGIN_ERROR: Access token not found in response.");
      }

      if (!data.refresh_token) {
        throw new Error("LOGIN_ERROR: Refresh token not found in response.");
      }

      configSession({
        persistencePreference: persistence,
      });

      await storeAuthToken(data.access_token, secretKey, persistence);
      await storeAuthRefreshToken(data.refresh_token, secretKey, persistence);
      return data;
    } catch (error) {
      handleError(error, false);
      throw error;
    }
  };

  /**
   * Refreshes the authentication tokens using the stored refresh token.
   * If no refresh token is found, it throws an error and initiates a logout.
   *
   * @returns {Promise<AuthResponse>} The new authentication response with refreshed tokens.
   * @throws {Error} If the refresh token is missing or the refresh request fails.
   */
  const refresh = async (): Promise<AuthResponse> => {
    try {
      const refreshToken = await getAuthRefreshToken(
        secretKey,
        currentPersistencePreference
      );

      if (!refreshToken) {
        throw new Error("TOKEN_MISSING: No refresh token found");
      }

      const { data } = await axiosInstance.post<AuthResponse>(
        endpoints.REFRESH,
        { refresh_token: refreshToken }
      );

      await storeAuthToken(
        data.access_token,
        secretKey,
        currentPersistencePreference
      );
      await storeAuthRefreshToken(
        data.refresh_token,
        secretKey,
        currentPersistencePreference
      );
      return data;
    } catch (error) {
      handleError(error, false);
      await logout();
      throw error;
    }
  };

  return {
    logout,
    login,
    refresh
  };
}
