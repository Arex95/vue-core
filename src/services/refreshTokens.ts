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
   * Refreshes the authentication tokens using the stored refresh token.
   * This function can also accept optional token paths if the refresh endpoint
   * returns tokens with a different structure than the default login.
   * If no refresh token is found, it throws an error and initiates a logout.
   *
   * @param {AuthTokenPaths} [tokenPaths] - Optional configuration for the paths (in dot notation) of the access and refresh tokens in the refresh endpoint response.
   * @returns {Promise<AuthResponse>} The new authentication response with refreshed tokens.
   * @throws {Error} If the refresh token is missing or the refresh request fails.
   */
  export const refreshTokens = async (
    axiosInstance: AxiosInstance,
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