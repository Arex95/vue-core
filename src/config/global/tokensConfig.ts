import { TokensConfig } from "@/types";

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
 * Configures the global storage keys for the access and refresh tokens.
 * This function should be called once at application startup to define the keys
 * used for storing tokens in `localStorage` or `sessionStorage`. The configuration
 * is frozen to prevent runtime changes.
 *
 * @param {TokenKeyConfig} config - An object containing the token storage keys.
 * @param {string} config.accessTokenKey - The key for the access token.
 * @param {string} config.refreshTokenKey - The key for the refresh token.
 */
export function configTokenKeys(config: TokenKeyConfig): void {
  tokensConfig = Object.freeze({
    ACCESS_TOKEN: config.accessTokenKey,
    REFRESH_TOKEN: config.refreshTokenKey,
  });
}

/**
 * Retrieves the configured storage keys for the access and refresh tokens.
 *
 * @returns {TokensConfig} A frozen object containing the `ACCESS_TOKEN` and `REFRESH_TOKEN` keys.
 */
export function getTokenConfig(): TokensConfig {
  return tokensConfig;
}
