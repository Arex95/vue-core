import { AuthTokenPaths } from "@/types";
import { safeGet } from "@utils/objects";
import { TokenValidationResult } from '@/types';

/**
 * Extracts and validates the access and refresh tokens from a response object.
 * Throws an error if the tokens are not found or are invalid.
 *
 * @param {any} data - The API response object.
 * @param {AuthTokenPaths} tokenPaths - The paths for the tokens.
 * @param {string} errorSource - A prefix for the error message ("LOGIN" or "REFRESH").
 * @returns {TokenValidationResult} An object with the validated tokens.
 */
export const extractAndValidateTokens = (
  data: any,
  tokenPaths: AuthTokenPaths,
  errorSource: string
): TokenValidationResult => {
  const accessTokenPath = tokenPaths?.accessTokenPath || "access_token";
  const refreshTokenPath = tokenPaths?.refreshTokenPath || "refresh_token";

  if (!data) {
    throw new Error(`${errorSource}_ERROR: No data received.`);
  }

  const accessToken = safeGet(data, accessTokenPath.split("."));
  const refreshToken = safeGet(data, refreshTokenPath.split("."));

  if (!accessToken || typeof accessToken !== "string") {
    throw new Error(
      `${errorSource}_ERROR: Access token not found or invalid at path '${accessTokenPath}' in response.`
    );
  }

  if (!refreshToken || typeof refreshToken !== "string") {
    throw new Error(
      `${errorSource}_ERROR: Refresh token not found or invalid at path '${refreshTokenPath}' in response.`
    );
  }

  return { accessToken, refreshToken };
};
