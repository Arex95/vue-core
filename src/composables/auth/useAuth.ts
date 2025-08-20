import { getConfiguredAxiosInstance } from "@config/axios/axiosInstance";
import { getEndpointsConfig } from "@config/global/endpointsConfig";
import { handleError } from "@utils/errors";
import {
  cleanCredentials,
} from "@/services/credentials";
import { AuthResponse, AuthTokenPaths, LocationPreference } from "@/types";
import {
  configSession,
  getSessionPersistence,
} from "@config/global/sessionConfig";
import {
  getTokenPathsConfig
} from "@config/global/tokenPathsConfig";
import { extractAndValidateTokens } from "@services/extractTokens";
import { storeTokens } from "@services/storeTokens";

/**
 * Custom hook for authentication logic, including login, logout, token management, and session preference.
 *
 * @param {string} secretKey - The secret key used for token encryption/decryption.
 * @returns {AuthHook} An object containing authentication functions.
 */
export function useAuth() {
  const axiosInstance = getConfiguredAxiosInstance();
  const endpoints = getEndpointsConfig();

  /**
   * Logs out the user by making a POST request to the logout endpoint,
   * cleaning all stored credentials, and reloading the page.
   * The session persistence preference is NOT reset here; it persists across logouts.
   *
   * @param {AuthParams} [params={}] - Optional parameters to send with the logout request.
   * @returns {Promise<void>}
   */
  const logout = async (params: any = {}): Promise<void> => {
    try {
      await axiosInstance.post(endpoints.LOGOUT, params);
    } catch (error) {
      handleError(error, false);
    } finally {
      await cleanCredentials(await getSessionPersistence());
      window.location.reload();
    }
  };

  /**
   * Authenticates the user by making a POST request to the login endpoint,
   * stores the received access and refresh tokens, and sets the session persistence preference.
   *
   * @param {AuthParams} params - The authentication parameters (e.g., username, password).
   * @param {LocationPreference} persistence - The storage preference: 'local' for localStorage, 'session' for sessionStorage.
   * @param {AuthTokenPaths} [tokenPaths] - Optional configuration for the paths (in dot notation) where the tokens are located in the API response.
   * @returns {Promise<AuthResponse>} The authentication response containing the tokens and user information.
   * @throws {Error} If the login request fails, or if the access/refresh tokens are not found or are invalid in the response.
   */
  const login = async (
    params: any = {},
    persistence: LocationPreference,
    tokenPaths: AuthTokenPaths = getTokenPathsConfig()
  ): Promise<AuthResponse> => {
    try {
      const { data } = await axiosInstance.post<AuthResponse>(
        endpoints.LOGIN,
        params
      );

      const { accessToken, refreshToken } = extractAndValidateTokens(
        data,
        tokenPaths,
        "LOGIN"
      );

      configSession({
        persistencePreference: persistence,
      });

      await storeTokens(accessToken, refreshToken, persistence);
      return data;
    } catch (error) {
      handleError(error, false);
      throw error;
    }
  };

  return {
    logout,
    login
  };
}
