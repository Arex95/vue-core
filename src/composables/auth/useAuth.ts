import { getAxiosInstance } from "@config/axios";
import { getEndpointsConfig } from "@config/global/endpointsConfig";
import { handleError } from "@utils/errors";
import {
  getAuthToken,
  getAuthRefreshToken,
  storeAuthToken,
  storeAuthRefreshToken,
  cleanCredentials,
} from "@utils/credentials";
import { jwtDecode } from "jwt-decode";
import { AuthParams, AuthResponse } from "@/types";

import {
  configSession,
  getSessionPersistencePreference,
  SessionPreference,
} from "@config/global/sessionConfig";

/**
 * @typedef {object} AuthHook
 * @property {function(): Promise<string | null>} getJwt - Retrieves the current JWT.
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
export function useAuth(secretKey: string) {
  const axiosInstance = getAxiosInstance();
  const endpoints = getEndpointsConfig();
  const currentPersistencePreference: SessionPreference =
    getSessionPersistencePreference();

  /**
   * Retrieves the current JSON Web Token (JWT) from storage based on the active session preference.
   *
   * @returns {Promise<string | null>} The JWT string if found, otherwise null.
   */
  const getJwt = async (): Promise<string | null> => {
    try {
      return await getAuthToken(secretKey, currentPersistencePreference);
    } catch (error) {
      handleError("Error getting JWT: " + error, false);
      return null;
    }
  };

  /**
   * Retrieves the expiration timestamp of the current authentication token in milliseconds.
   *
   * @returns {Promise<number | null>} The expiration timestamp in milliseconds if the token is valid, otherwise null.
   */
  const getTokenExpiry = async (): Promise<number | null> => {
    const token = await getJwt();
    if (!token) return null;
    try {
      const decoded: { exp?: number } = jwtDecode(token);
      return decoded.exp ? decoded.exp * 1000 : null;
    } catch (error: any) {
      handleError(
        `TOKEN_INVALID: Token verification failed (malformed or unreadable): ${error.message}`,
        false
      );
      return null;
    }
  };

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

  /**
   * Verifies the validity and expiration of the current authentication token.
   * If the token is missing, invalid, or expired, appropriate errors are thrown and credentials are cleaned.
   *
   * @returns {Promise<boolean>} True if the token is valid and unexpired.
   * @throws {Error} "TOKEN_MISSING" if no token is found, "TOKEN_EXPIRED" if the token has expired,
   * "TOKEN_INVALID" if the token format is invalid.
   */
  const verifyAuth = async (): Promise<boolean> => {
    const token = await getJwt();
    if (!token) {
      handleError("TOKEN_MISSING: No valid token found", false);
      await cleanCredentials(currentPersistencePreference);
      throw new Error("TOKEN_MISSING: No valid token found");
    }

    try {
      const decoded: { exp?: number } = jwtDecode(token);
      const currentTime = Date.now() / 1000;

      if (typeof decoded.exp !== "number") {
        throw new Error("Invalid expiration format");
      }

      if (decoded.exp <= currentTime) {
        handleError("TOKEN_EXPIRED: Token is expired", false);
        await cleanCredentials(currentPersistencePreference);
        throw new Error("TOKEN_EXPIRED: Token is expired");
      }

      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes("Invalid")) {
        handleError("TOKEN_INVALID: Invalid token format", false);
        await cleanCredentials(currentPersistencePreference);
        throw new Error("TOKEN_INVALID: Invalid token format");
      }

      throw error;
    }
  };

  return {
    getJwt,
    getTokenExpiry,
    cleanCredentials,
    logout,
    login,
    refresh,
    verifyAuth
  };
}