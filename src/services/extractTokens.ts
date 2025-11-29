import { AuthTokenPaths } from "@/types";
import { safeGet } from "@utils/objects";
import { TokenValidationResult } from '@/types';

/**
 * Extracts access and refresh tokens from a response object using specified dot-notation paths
 * and validates their existence and type.
 *
 * @param {any} data - The response object from which to extract the tokens.
 * @param {AuthTokenPaths} tokenPaths - An object containing the dot-notation paths for the access and refresh tokens.
 * @param {string} errorSource - A string to identify the source of the operation (e.g., "LOGIN", "REFRESH") for error messages.
 * @returns {TokenValidationResult} An object containing the extracted `accessToken` and `refreshToken`.
 * @throws {Error} If the data object is missing, or if the access or refresh tokens cannot be found at the specified paths or are not strings.
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
