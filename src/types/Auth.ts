import { TokensConfig, EndpointsConfig } from "@/types";

/**
 * Defines the configuration for authentication-related settings, including API endpoints and storage keys.
 */
export type AuthConfig = {
  /** The API endpoints for login, refresh, and logout operations. */
  endpoints: EndpointsConfig;
  /** The keys used to store authentication tokens in local or session storage. */
  storageKeys: TokensConfig;
}

/**
 * Defines the structure for specifying the dot-notation paths to the access and refresh tokens
 * within an API response. This allows for flexibility in handling different response structures.
 */
export interface AuthTokenPaths {
  /** The path to the access token in the response data (e.g., 'data.accessToken'). */
  accessTokenPath?: string;
  /** The path to the refresh token in the response data (e.g., 'data.refreshToken'). */
  refreshTokenPath?: string;
}

/**
 * Represents a generic authentication response from the API.
 * Since the structure of the response can vary, it allows for any number of properties of any type.
 */
export interface AuthResponse {
  [key: string]: any;
}
