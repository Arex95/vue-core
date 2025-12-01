import { getEndpointsConfig } from "@config/global/endpointsConfig";
import { handleError } from "@utils/errors";
import {
  cleanCredentials,
} from "@/services/credentials";
import { AuthResponse, AuthTokenPaths, LocationPreference, Fetcher } from "@/types";
import {
  configSession,
  getSessionPersistence,
} from "@config/global/sessionConfig";
import {
  getTokenPathsConfig
} from "@config/global/tokenPathsConfig";
import { extractAndValidateTokens } from "@services/extractTokens";
import { storeTokens } from "@services/storeTokens";
import { getDefaultAuthFetcher } from "@/config/auth/authFetcher";

/**
 * Custom hook for authentication logic, including login, logout, token management, and session preference.
 * Accepts an optional fetcher function. If not provided, uses the default configured fetcher or falls back to Axios.
 *
 * @param {Fetcher} [fetcher] - Optional fetcher function to use for auth requests. If not provided, uses the default configured fetcher.
 * @returns {{
 *   logout: (params?: Record<string, unknown>) => Promise<void>,
 *   login: (params: Record<string, unknown>, persistence: LocationPreference, tokenPaths?: AuthTokenPaths) => Promise<AuthResponse>
 * }} An object containing authentication functions.
 * 
 * @example
 * ```typescript
 * // Using default fetcher (Axios)
 * const auth = useAuth();
 * 
 * // Using custom fetcher
 * const customFetcher = createOfetchFetcher();
 * const auth = useAuth(customFetcher);
 * ```
 */
export function useAuth(fetcher?: Fetcher) {
  const endpoints = getEndpointsConfig();
  
  const getFetcher = (): Fetcher => {
    return fetcher || getDefaultAuthFetcher();
  };

  /**
   * Logs out the user by making a POST request to the logout endpoint,
   * cleaning all stored credentials, and reloading the page.
   * The session persistence preference is NOT reset here; it persists across logouts.
   *
   * @param {Record<string, unknown>} [params={}] - Optional parameters to send with the logout request.
   * @returns {Promise<void>}
   */
  const logout = async (params: Record<string, unknown> = {}): Promise<void> => {
    try {
      await getFetcher()({
        method: 'POST',
        url: endpoints.LOGOUT,
        data: params,
      });
    } catch (error) {
      handleError(error);
    } finally {
      await cleanCredentials(await getSessionPersistence());
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
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
    params: Record<string, unknown> = {},
    persistence: LocationPreference,
    tokenPaths: AuthTokenPaths = getTokenPathsConfig()
  ): Promise<AuthResponse> => {
    try {
      const data = await getFetcher()({
        method: 'POST',
        url: endpoints.LOGIN,
        data: params,
      }) as AuthResponse;

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
      handleError(error);
      throw error;
    }
  };

  return {
    logout,
    login
  };
}
