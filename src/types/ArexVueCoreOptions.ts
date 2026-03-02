import { AxiosServiceOptions } from "./AxiosServiceOptions";

/**
 * Defines the comprehensive configuration object for initializing the Arex-Vue-Core library.
 * This interface gathers all the necessary settings, from API endpoints and token configurations
 * to the application key and Axios-specific options, providing a single point of configuration.
 */
export interface ArexVueCoreOptions {
  /** The secret key for encryption and decryption operations. */
  appKey: string;
  /** An object containing the authentication-related API endpoints. */
  endpoints: {
    /** The endpoint for user login. */
    login: string;
    /** The endpoint for refreshing authentication tokens. */
    refresh: string;
    /** The endpoint for user logout. */
    logout: string;
  };
  /** An object defining the keys for storing tokens in local/session storage. */
  tokenKeys: {
    /** The storage key for the access token. */
    accessToken: string;
    /** The storage key for the refresh token. */
    refreshToken: string;
  };
  /** An object specifying the dot-notation paths to find tokens in the login response. */
  tokenPaths: {
    /** The path to the access token in the login response data. */
    accessToken: string;
    /** The path to the refresh token in the login response data. */
    refreshToken: string;
  };
  /** An object specifying the dot-notation paths to find tokens in the refresh token response. */
  refreshTokenPaths: {
    /** The path to the access token in the refresh response data. */
    accessToken: string;
    /** The path to the refresh token in the refresh response data. */
    refreshToken: string;
  };
  /** The configuration options for the underlying Axios instance. */
  axios: AxiosServiceOptions;
  /**
   * Called when a token refresh attempt fails (e.g., to redirect to login via Vue Router).
   * Falls back to `window.location.reload()` if not provided.
   */
  onRefreshFailed?: () => void;
  /**
   * Called after a successful logout (e.g., to redirect to login via Vue Router).
   * Falls back to `window.location.reload()` if not provided.
   */
  onLogout?: () => void;
}
