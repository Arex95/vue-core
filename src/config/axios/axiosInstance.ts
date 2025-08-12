import { AxiosService } from "@config/axios/axiosConfig";
import { AxiosInstance } from "axios";

let axiosInstance: AxiosService;

/**
 * Configuration object for the Axios instance.
 */
interface AxiosConfig {
  baseURL: string;
}

/**
 * Configuration object for a custom Axios instance.
 */
interface CustomAxiosConfig {
  baseURL: string;
  headers?: Record<string, string>;
}

/**
 * Configures the global Axios instance with a base URL.
 *
 * @param {AxiosConfig} config - An object containing the base URL for the Axios instance.
 * @param {string} config.baseURL - The base URL for the Axios instance.
 *
 * @returns {void}
 */
export const configAxios = (config: AxiosConfig): void => {
  axiosInstance = new AxiosService({
    baseURL: config.baseURL,
  });
};

/**
 * Retrieves the configured Axios instance.
 *
 * @returns {AxiosService} The configured Axios instance.
 * @throws Will throw an error if the Axios instance is not configured.
 */
export const getAxiosInstance = () => {
  if (!axiosInstance) {
    throw new Error("Axios instance not configured. Call configAxios first.");
  }
  return axiosInstance.getAxiosInstance();
};

/**
 * Creates a new AxiosService instance with custom headers.
 *
 * @param {CustomAxiosConfig} config - An object containing the base URL and optional custom headers.
 * @param {string} config.baseURL - The base URL for the Axios instance.
 * @param {Record<string, string>} [config.headers] - Custom headers to set (optional).
 *
 * @returns {AxiosService} The new AxiosService instance.
 */
export const createCustomAxiosInstance = (
  config: CustomAxiosConfig
): AxiosInstance => {
  return new AxiosService({
    baseURL: config.baseURL,
    headers: config.headers,
  }).getAxiosInstance();
};
