import { EndpointsConfig } from "@/types";

let endpointsConfig: EndpointsConfig = {
  LOGIN: "/login",
  REFRESH: "/refresh",
  LOGOUT: "/logout",
};

/**
 * Configuration object for authentication endpoints.
 */
interface EndpointConfig {
  loginEndpoint: string;
  refreshEndpoint: string;
  logoutEndpoint: string;
}

/**
 * Configures the global authentication endpoint URLs for the application.
 * This function should be called once at startup to define the API endpoints for login,
 * token refresh, and logout. The configuration is then frozen to prevent changes.
 *
 * @param {EndpointConfig} config - An object containing the URLs for the authentication endpoints.
 * @param {string} config.loginEndpoint - The URL for the login endpoint.
 * @param {string} config.refreshEndpoint - The URL for the token refresh endpoint.
 * @param {string} config.logoutEndpoint - The URL for the logout endpoint.
 */
export function configEndpoints(config: EndpointConfig): void {
  endpointsConfig = Object.freeze({
    LOGIN: config.loginEndpoint,
    REFRESH: config.refreshEndpoint,
    LOGOUT: config.logoutEndpoint,
  });
}

/**
 * Retrieves the globally configured authentication endpoint URLs.
 *
 * @returns {EndpointsConfig} A frozen object containing the configured `LOGIN`, `REFRESH`, and `LOGOUT` endpoints.
 */
export function getEndpointsConfig(): EndpointsConfig {
  return endpointsConfig;
}
