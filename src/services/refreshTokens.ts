import { getAuthRefreshToken } from "@/services/credentials";
import { getSessionPersistence } from "@config/global/sessionConfig";
import { handleError } from "@utils/errors";
import { getAppKey } from "@config/global/keyConfig";
import { getEndpointsConfig } from "@config/global/endpointsConfig";
import { getRefreshTokenPathsConfig } from "@config/global/tokenPathsConfig";
import { AuthResponse, AuthTokenPaths } from "@/types";
import { extractAndValidateTokens } from "@services/extractTokens";
import { storeTokens } from "@services/storeTokens";
import { AxiosInstance } from 'axios';
import { cleanCredentials } from "@/services/credentials";

/**
 * Refreshes the access and refresh tokens by making a POST request to the refresh endpoint.
 * It retrieves the current refresh token from storage, sends it to the refresh endpoint,
 * and then stores the new tokens upon a successful response. If the refresh process fails
 * or no refresh token is found, it clears all credentials and reloads the page.
 *
 * @param {AxiosInstance} axiosInstance - The Axios instance to use for the refresh request.
 * @returns {Promise<AuthResponse>} A promise that resolves with the new authentication response containing the refreshed tokens.
 * @throws {Error} Throws an error if the refresh token is missing or if the refresh request fails, which is then caught to trigger a logout.
 */
  export const refreshTokens = async (
    axiosInstance: AxiosiosInstance,
  ): Promise<AuthResponse> => {
    const tokenPaths: AuthTokenPaths = getRefreshTokenPathsConfig();
    const endpoints = getEndpointsConfig();
    const secretKey = getAppKey();
    const persistence = await getSessionPersistence();

    try {
      const refreshTokenFromStorage = await getAuthRefreshToken(
        secretKey,
        "any"
      );

      if (!refreshTokenFromStorage) {
        throw new Error("TOKEN_MISSING: No refresh token found in storage.");
      }

      const { data } = await axiosInstance.post<AuthResponse>(
        endpoints.REFRESH
      );

      const { accessToken, refreshToken } = extractAndValidateTokens(
        data,
        tokenPaths,
        "REFRESH"
      );

      await storeTokens(accessToken, refreshToken, persistence);

      return data;
    } catch (error) {
      handleError(error, false);
      await cleanCredentials(persistence);
      if (window) { 
        window.location.reload();
      }
      throw error;
    }
  };