import { TokenConfig } from "@/types"

let secretKey: string = "12345678901234567890123456789012";

let tokenConfig: TokenConfig = Object.freeze({
  ACCESS_TOKEN: "authToken",
  REFRESH_TOKEN: "refreshToken",
})

/**
 * Configures the global keys for access and refresh tokens.
 * Once set, they cannot be modified.
 *
 * @param {string} accessTokenKey - The name of the access token key.
 * @param {string} refreshTokenKey - The name of the refresh token key.
 *
 * @returns {void} Does not return anything but freezes the token configuration object.
 */
export function configTokens(
  accessTokenKey: string,
  refreshTokenKey: string
): void {
  tokenConfig = Object.freeze({
    ACCESS_TOKEN: accessTokenKey,
    REFRESH_TOKEN: refreshTokenKey,
  })
}

/**
 * Retrieves the current token configuration.
 *
 * @returns {TokenConfig} The configuration of the access and refresh token keys.
 */
export function getTokenConfig(): TokenConfig {
  return tokenConfig;
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