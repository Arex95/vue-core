import { getAxiosInstance } from "@config/axios";
import { getEndpointsConfig } from "@config/global/endpointsConfig";
import { handleError } from "@utils/errors";
import {
  getAuthRefreshToken,
  storeAuthToken,
  storeAuthRefreshToken,
  cleanCredentials,
} from "@utils/credentials";
import { AuthParams, AuthResponse, AuthTokenPaths } from "@/types";
import { safeGet } from "@utils/objects";
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
 * @property {(params: AuthParams, persistence: SessionPreference, tokenPaths?: AuthTokenPaths) => Promise<AuthResponse>} login - Logs in the user and stores tokens.
 * @property {(tokenPaths?: AuthTokenPaths) => Promise<AuthResponse>} refresh - Refreshes authentication tokens.
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
   * @param {AuthTokenPaths} [tokenPaths] - Configuración opcional para las rutas (en notación de punto) donde se encuentran los tokens en la respuesta de la API.
   * @returns {Promise<AuthResponse>} La respuesta de autenticación que contiene los tokens e información del usuario.
   * @throws {Error} Si la solicitud de login falla, o si los tokens de acceso/refresco no se encuentran o no son válidos en la respuesta.
   */
  const login = async (
    params: AuthParams,
    persistence: SessionPreference,
    tokenPaths?: AuthTokenPaths
  ): Promise<AuthResponse> => {
    try {
      const { data } = await axiosInstance.post<AuthResponse>(
        endpoints.LOGIN,
        params
      );

      const accessTokenPath = tokenPaths?.accessTokenPath || "access_token";
      const refreshTokenPath = tokenPaths?.refreshTokenPath || "refresh_token";

      const accessTokenPathArray = accessTokenPath.split(".");
      const refreshTokenPathArray = refreshTokenPath.split(".");

      if (!data) {
        throw new Error("LOGIN_ERROR: No data received from login endpoint.");
      }

      const accessToken = safeGet(data, accessTokenPathArray);
      const refreshToken = safeGet(data, refreshTokenPathArray);

      if (!accessToken || typeof accessToken !== "string") {
        throw new Error(
          `LOGIN_ERROR: Access token not found or invalid at path '${accessTokenPath}' in response.`
        );
      }

      if (!refreshToken || typeof refreshToken !== "string") {
        throw new Error(
          `LOGIN_ERROR: Refresh token not found or invalid at path '${refreshTokenPath}' in response.`
        );
      }

      configSession({
        persistencePreference: persistence,
      });

      await storeAuthToken(accessToken, secretKey, persistence);
      await storeAuthRefreshToken(refreshToken, secretKey, persistence);
      return data;
    } catch (error) {
      handleError(error, false);
      throw error;
    }
  };

  /**
   * Refreshes the authentication tokens using the stored refresh token.
   * This function can also accept optional token paths if the refresh endpoint
   * returns tokens with a different structure than the default login.
   * If no refresh token is found, it throws an error and initiates a logout.
   *
   * @param {AuthTokenPaths} [tokenPaths] - Configuración opcional para las rutas (en notación de punto) de los tokens de acceso y refresco en la respuesta del endpoint de refresco.
   * @returns {Promise<AuthResponse>} The new authentication response with refreshed tokens.
   * @throws {Error} If the refresh token is missing or the refresh request fails.
   */
  const refresh = async (
    tokenPaths?: AuthTokenPaths
  ): Promise<AuthResponse> => {
    try {
      const refreshTokenFromStorage = await getAuthRefreshToken(
        secretKey,
        currentPersistencePreference
      );

      if (!refreshTokenFromStorage) {
        throw new Error("TOKEN_MISSING: No refresh token found in storage.");
      }

      const { data } = await axiosInstance.post<AuthResponse>(
        endpoints.REFRESH,
        { refresh_token: refreshTokenFromStorage }
      );

      const accessTokenPath = tokenPaths?.accessTokenPath || "access_token";
      const refreshTokenPath = tokenPaths?.refreshTokenPath || "refresh_token";

      const accessTokenPathArray = accessTokenPath.split(".");
      const refreshTokenPathArray = refreshTokenPath.split(".");

      if (!data) {
        throw new Error(
          "REFRESH_ERROR: No data received from refresh endpoint."
        );
      }

      const accessTokenAfterRefresh = safeGet(data, accessTokenPathArray);
      const refreshTokenAfterRefresh = safeGet(data, refreshTokenPathArray);

      if (
        !accessTokenAfterRefresh ||
        typeof accessTokenAfterRefresh !== "string"
      ) {
        throw new Error(
          `REFRESH_ERROR: Access token not found or invalid at path '${accessTokenPath}' in refresh response.`
        );
      }
      if (
        !refreshTokenAfterRefresh ||
        typeof refreshTokenAfterRefresh !== "string"
      ) {
        throw new Error(
          `REFRESH_ERROR: Refresh token not found or invalid at path '${refreshTokenPath}' in refresh response.`
        );
      }

      await storeAuthToken(
        accessTokenAfterRefresh,
        secretKey,
        currentPersistencePreference
      );
      await storeAuthRefreshToken(
        refreshTokenAfterRefresh,
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
    refresh,
  };
}
