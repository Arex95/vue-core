import { getAuthRefreshToken } from "@/services/credentials";
import { getSessionPersistence } from "@config/global/sessionConfig";
import { handleError } from "@utils/errors";
import { getAppKey } from "@config/global/keyConfig";
import { getEndpointsConfig } from "@config/global/endpointsConfig";
import { getRefreshTokenPathsConfig } from "@config/global/tokenPathsConfig";
import { AuthResponse, AuthTokenPaths, Fetcher } from "@/types";
import { extractAndValidateTokens } from "@services/extractTokens";
import { storeTokens } from "@services/storeTokens";
import { cleanCredentials } from "@/services/credentials";
import { getDefaultAuthFetcher } from "@/config/auth/authFetcher";
import { UniversalStorage } from "@/utils/storage/UniversalStorage";
import { createStorageForRequest } from "@/utils/storage/storageFactory";
import { getGlobalSSRContextGetter } from "@/config/global/storageConfig";
import { getTokenConfig } from "@/config/global/tokensConfig";

/**
 * Refreshes the access and refresh tokens by making a POST request to the refresh endpoint.
 * It retrieves the current refresh token from storage, sends it to the refresh endpoint,
 * and then stores the new tokens upon a successful response. If the refresh process fails
 * or no refresh token is found, it clears all credentials and reloads the page.
 *
 * @param {Fetcher} [fetcher] - Optional fetcher function to use for the refresh request. If not provided, uses the default configured fetcher.
 * @param {UniversalStorage} [storage] - Optional UniversalStorage instance. If provided, uses it for SSR context-aware token operations.
 * @returns {Promise<AuthResponse>} A promise that resolves with the new authentication response containing the refreshed tokens.
 * @throws {Error} Throws an error if the refresh token is missing or if the refresh request fails, which is then caught to trigger a logout.
 */
export const refreshTokens = async (
  fetcher?: Fetcher,
  storage?: UniversalStorage
): Promise<AuthResponse> => {
  const tokenPaths: AuthTokenPaths = getRefreshTokenPathsConfig();
  const endpoints = getEndpointsConfig();
  const secretKey = getAppKey();
  const persistence = await getSessionPersistence();
  const getFetcher = (): Fetcher => fetcher || getDefaultAuthFetcher();
  
  // Usar storage proporcionado o crear uno nuevo con factory
  const storageInstance = storage || createStorageForRequest(getGlobalSSRContextGetter() || undefined);
  const tokensConfig = getTokenConfig();

  try {
    // Obtener refresh token usando storage
    const refreshTokenFromStorage = await storageInstance.getDecrypted(tokensConfig.REFRESH_TOKEN);

    if (!refreshTokenFromStorage) {
      throw new Error("TOKEN_MISSING: No refresh token found in storage.");
    }

    const data = await getFetcher()({
      method: 'POST',
      url: endpoints.REFRESH,
    }) as AuthResponse;

    const { accessToken, refreshToken } = extractAndValidateTokens(
      data,
      tokenPaths,
      "REFRESH"
    );

    // Guardar tokens usando storage
    await storageInstance.setEncrypted(tokensConfig.ACCESS_TOKEN, accessToken);
    await storageInstance.setEncrypted(tokensConfig.REFRESH_TOKEN, refreshToken);

    return data;
  } catch (error) {
    handleError(error);
    // Limpiar tokens usando storage
    await storageInstance.removeEncrypted(tokensConfig.ACCESS_TOKEN);
    await storageInstance.removeEncrypted(tokensConfig.REFRESH_TOKEN);
    
    if (typeof window !== 'undefined') { 
      window.location.reload();
    }
    throw error;
  }
};