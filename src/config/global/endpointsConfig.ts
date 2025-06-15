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
 * Configures authentication endpoint URLs globally.
 * This function freezes the object to prevent further modifications.
 *
 * @param {EndpointConfig} config - An object containing the authentication endpoint URLs.
 * @param {string} config.loginEndpoint - URL of the login endpoint.
 * @param {string} config.refreshEndpoint - URL of the refresh token endpoint.
 * @param {string} config.logoutEndpoint - URL of the logout endpoint.
 *
 * @returns {void} Does not return anything but freezes the endpoint configuration object.
 */
export function configEndpoints(config: EndpointConfig): void {
  endpointsConfig = Object.freeze({
    LOGIN: config.loginEndpoint,
    REFRESH: config.refreshEndpoint,
    LOGOUT: config.logoutEndpoint,
  });
}

/**
 * Retrieves the configured authentication endpoint URLs.
 *
 * @returns {EndpointsConfig} An object containing the configured authentication endpoints.
 * @property {string} LOGIN - URL of the login endpoint.
 * @property {string} REFRESH - URL of the refresh token endpoint.
 * @property {string} LOGOUT - URL of the logout endpoint.
 */
export function getEndpointsConfig(): EndpointsConfig {
  return endpointsConfig;
}
