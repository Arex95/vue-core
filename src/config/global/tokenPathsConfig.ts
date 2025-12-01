import { AuthTokenPaths } from "@/types";

interface TokenPathsConfig {
  accessTokenPath?: string;
  refreshTokenPath?: string;
}

let tokenPathsConfig: AuthTokenPaths = {
  accessTokenPath: "data.access_token",
  refreshTokenPath: "data.refresh_token",
};

let refreshTokenPathsConfig: AuthTokenPaths = {
  accessTokenPath: "data.access_token",
  refreshTokenPath: "data.refresh_token",
};

/**
 * Configures the dot-notation paths for extracting access and refresh tokens from the initial login response.
 * The configuration is frozen to prevent runtime changes.
 *
 * @param {TokenPathsConfig} config - An object containing the token paths.
 * @param {string} [config.accessTokenPath="data.access_token"] - The path to the access token.
 * @param {string} [config.refreshTokenPath="data.refresh_token"] - The path to the refresh token.
 */
export function configTokenPaths(config: TokenPathsConfig): void {
  tokenPathsConfig = Object.freeze({
    accessTokenPath: config.accessTokenPath || "data.access_token",
    refreshTokenPath: config.refreshTokenPath || "data.refresh_token",
  });
}

/**
 * Configures the dot-notation paths for extracting access and refresh tokens from the token refresh response.
 * The configuration is frozen to prevent runtime changes.
 *
 * @param {TokenPathsConfig} config - An object containing the token paths for the refresh response.
 * @param {string} [config.accessTokenPath="data.access_token"] - The path to the new access token.
 * @param {string} [config.refreshTokenPath="data.refresh_token"] - The path to the new refresh token.
 */
export function configRefreshTokenPaths(config: TokenPathsConfig): void {
  refreshTokenPathsConfig = Object.freeze({
    accessTokenPath: config.accessTokenPath || "data.access_token",
    refreshTokenPath: config.refreshTokenPath || "data.refresh_token",
  });
}

/**
 * Retrieves the configured token paths for the initial login response.
 *
 * @returns {AuthTokenPaths} A frozen object containing the `accessTokenPath` and `refreshTokenPath`.
 */
export function getTokenPathsConfig(): TokenPathsConfig {
  return tokenPathsConfig;
}

/**
 * Retrieves the configured token paths for the token refresh response.
 *
 * @returns {AuthTokenPaths} A frozen object containing the `accessTokenPath` and `refreshTokenPath` for the refresh response.
 */
export function getRefreshTokenPathsConfig(): TokenPathsConfig {
  return refreshTokenPathsConfig;
}
