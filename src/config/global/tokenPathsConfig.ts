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
 * Configures the paths for access and refresh tokens in the authentication response.
 * This function freezes the object to prevent further modifications.
 *
 * @param {TokenPathsConfig} config - An object containing the paths for access and refresh tokens.
 * @param {string} [config.accessTokenPath="data.access_token"] - Path to the access token in the response.
 * @param {string} [config.refreshTokenPath="data.refresh_token"] - Path to the refresh token in the response.
 *
 * @returns {void} Does not return anything but freezes the token paths configuration object.
 */
export function configTokenPaths(config: TokenPathsConfig): void {
  tokenPathsConfig = Object.freeze({
    accessTokenPath: config.accessTokenPath || "data.access_token",
    refreshTokenPath: config.refreshTokenPath || "data.refresh_token",
  });
}

/**
 * Configures the paths for access and refresh tokens in the refresh response.
 * This function freezes the object to prevent further modifications.
 *
 * @param {TokenPathsConfig} config - An object containing the paths for access and refresh tokens.
 * @param {string} [config.accessTokenPath="data.access_token"] - Path to the access token in the response.
 * @param {string} [config.refreshTokenPath="data.refresh_token"] - Path to the refresh token in the response.
 *
 * @returns {void} Does not return anything but freezes the refresh token paths configuration object.
 */
export function configRefreshTokenPaths(config: TokenPathsConfig): void {
  refreshTokenPathsConfig = Object.freeze({
    accessTokenPath: config.accessTokenPath || "data.access_token",
    refreshTokenPath: config.refreshTokenPath || "data.refresh_token",
  });
}

/**
 * Retrieves the configured authentication token paths.
 *
 * @returns {AuthTokenPaths} An object containing the configured authentication token paths.
 * @property {string} accessTokenPath - Path to the access token in the response.
 * @property {string} refreshTokenPath - Path to the refresh token in the response.
 */
export function getTokenPathsConfig(): TokenPathsConfig {
  return tokenPathsConfig;
}

export function getRefreshTokenPathsConfig(): TokenPathsConfig {
  return refreshTokenPathsConfig;
}
