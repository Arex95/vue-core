/**
 * Defines the structure for the token configuration object, which specifies the storage keys
 * for the access and refresh tokens. The properties are read-only to ensure they are not
 * accidentally modified at runtime.
 */
export type TokensConfig = {
  /** The key used to store the access token in `localStorage` or `sessionStorage`. */
  readonly ACCESS_TOKEN: string;
  /** The key used to store the refresh token in `localStorage` or `sessionStorage`. */
  readonly REFRESH_TOKEN: string;
}