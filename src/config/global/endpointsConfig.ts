import { EndpointsConfig } from "@/types"

let endpointsConfig: EndpointsConfig = {
  LOGIN: "/login",
  REFRESH: "/refresh",
  LOGOUT: "/logout",
};

/**
 * Configures authentication endpoint URLs globally.
 * This function freezes the object to prevent further modifications.
 *
 * @param {string} loginEndpoint - URL of the login endpoint.
 * @param {string} refreshEndpoint - URL of the refresh token endpoint.
 * @param {string} logoutEndpoint - URL of the logout endpoint.
 *
 * @returns {void} Does not return anything but freezes the endpoint configuration object.
 */
export function configureEndpoints(
  loginEndpoint: string,
  refreshEndpoint: string,
  logoutEndpoint: string
): void {
  endpointsConfig = Object.freeze({
    LOGIN: loginEndpoint,
    REFRESH: refreshEndpoint,
    LOGOUT: logoutEndpoint,
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