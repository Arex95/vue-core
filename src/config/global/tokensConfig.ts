import { TokensConfig } from "@/types";

let secretKey: string = "12345678901234567890123456789012";

let tokensConfig: TokensConfig = Object.freeze({
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
});

/**
 * Configuration object for token keys.
 */
interface TokenKeyConfig {
  accessTokenKey: string;
  refreshTokenKey: string;
}

/**
 * Configures the global keys for access and refresh tokens.
 * Once set, they cannot be modified.
 *
 * @param {TokenKeyConfig} config - An object containing the token keys.
 * @param {string} config.accessTokenKey - The name of the key for the access token.
 * @param {string} config.refreshTokenKey - The name of the key for the refresh token.
 *
 * @returns {void} Does not return anything, but freezes the token configuration object.
 */
export function configTokenKeys(config: TokenKeyConfig): void {
  tokensConfig = Object.freeze({
    ACCESS_TOKEN: config.accessTokenKey,
    REFRESH_TOKEN: config.refreshTokenKey,
  });
}

/**
 * Retrieves the current token configuration.
 *
 * @returns {TokensConfig} The configuration of the access and refresh token keys.
 */
export function getTokenConfig(): TokensConfig {
  return tokensConfig;
}

/**
 * Sets the secret key for use in authentication.
 *
 * @param {string} key - The new secret key.
 *
 * @returns {void} Does not return anything, but updates the secret key.
 */
export function setSecretKey(key: string): void {
  secretKey = key;
}

/**
 * Retrieves the current secret key.
 *
 * @returns {string} The configured secret key.
 */
export function getSecretKey(): string {
  return secretKey;
}
