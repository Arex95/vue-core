export interface ArexVueCoreOptions {
  /**
   * The authentication endpoints.
   */
  endpoints: {
    /** The login endpoint. */
    login: string;
    /** The token refresh endpoint. */
    refresh: string;
    /** The logout endpoint. */
    logout: string;
  };
  /**
   * The key prefixes for storing tokens.
   */
  tokenKeys: {
    /** The access token key prefix. */
    accessToken: string;
    /** The refresh token key prefix. */
    refreshToken: string;
  };
  /**
   * The base URL for the API.
   */
  apiUrl: string;
}
