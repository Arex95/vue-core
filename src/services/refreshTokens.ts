import { getAuthRefreshToken } from '@/services/credentials';
import { getSessionPersistence } from '@config/global/sessionConfig';
import { handleError } from '@utils/errors';
import { getAppKey } from '@config/global/keyConfig';
import { getEndpointsConfig } from '@config/global/endpointsConfig';
import { getRefreshTokenPathsConfig } from '@config/global/tokenPathsConfig';
import { getCallbacksConfig } from '@config/global/callbacksConfig';
import { AuthResponse, AuthTokenPaths, Fetcher } from '@/types';
import { extractAndValidateTokens } from '@services/extractTokens';
import { storeTokens } from '@services/storeTokens';
import { cleanCredentials } from '@/services/credentials';
import { getDefaultAuthFetcher } from '@/config/auth/authFetcher';

/**
 * Refreshes the access and refresh tokens.
 *
 * Fixes over the original:
 *   1. Uses `persistence` (the location where tokens were originally stored)
 *      instead of hardcoding `"any"` — so cookies / localStorage / sessionStorage
 *      are searched in the right place.
 *   2. Sends the refresh token in the request body using the configured
 *      `refreshTokenPaths.refreshTokenPath` as the body key, so the backend
 *      always receives it regardless of withCredentials or cookie settings.
 *
 * On failure: clears credentials and calls `onRefreshFailed` callback.
 */
export const refreshTokens = async (fetcher?: Fetcher): Promise<AuthResponse> => {
  const tokenPaths: AuthTokenPaths = getRefreshTokenPathsConfig();
  const endpoints   = getEndpointsConfig();
  const secretKey   = getAppKey();
  const persistence = await getSessionPersistence();
  const getFetcher  = (): Fetcher => fetcher ?? getDefaultAuthFetcher();

  try {
    // Use persistence (not hardcoded "any") — tokens live where they were stored
    const refreshToken = await getAuthRefreshToken(secretKey, persistence);

    if (!refreshToken) {
      throw new Error('TOKEN_MISSING: No refresh token found in storage.');
    }

    // Send refresh token in the request body using the configured path key
    const refreshBodyKey = tokenPaths.refreshTokenPath ?? 'refresh_token';
    const data = await getFetcher()({
      method: 'POST',
      url: endpoints.REFRESH,
      data: { [refreshBodyKey]: refreshToken },
    }) as AuthResponse;

    const { accessToken, refreshToken: newRefreshToken } = extractAndValidateTokens(
      data,
      tokenPaths,
      'REFRESH'
    );

    await storeTokens(accessToken, newRefreshToken, persistence);

    return data;
  } catch (error) {
    handleError(error);
    await cleanCredentials(persistence);
    const { onRefreshFailed } = getCallbacksConfig();
    if (onRefreshFailed) {
      onRefreshFailed();
    } else if (typeof window !== 'undefined') {
      window.location.reload();
    }
    throw error;
  }
};
