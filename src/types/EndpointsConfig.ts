/**
 * Defines the structure for the authentication endpoints configuration object.
 * This type ensures that the necessary endpoints for login, token refresh, and logout are defined.
 */
export type EndpointsConfig = {
  /** The URL for the login endpoint. */
  LOGIN: string;
  /** The URL for the token refresh endpoint. */
  REFRESH: string;
  /** The URL for the logout endpoint. */
  LOGOUT: string;
}