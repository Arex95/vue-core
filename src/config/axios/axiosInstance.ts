import { AxiosService } from "@config/axios/axiosConfig";
import { AxiosServiceOptions } from "@/types/AxiosServiceOptions";
import { AxiosInstance } from "axios";

let axiosServiceInstance: AxiosService | null = null;
let defaultConfig: AxiosServiceOptions | null = null;

/**
 * Configures the singleton Axios service instance for the application.
 * This function should be called once at the application's entry point to set up
 * the base URL, headers, and other default configurations for all API requests.
 *
 * @param {AxiosServiceOptions} config - The configuration options for the Axios service.
 */
export const configAxios = (config: AxiosServiceOptions): void => {
  defaultConfig = config;
  axiosServiceInstance = new AxiosService({
    baseURL: config.baseURL,
    headers: config.headers,
    timeout: config.timeout,
    withCredentials: config.withCredentials
  });
};

/**
 * Retrieves the configured singleton Axios instance.
 * If not configured yet, creates a default instance with minimal configuration.
 * This allows lazy initialization to avoid dependency circular issues in Nuxt and other frameworks.
 *
 * @returns {AxiosInstance} The configured Axios instance.
 */
export const getConfiguredAxiosInstance = (): AxiosInstance => {
  if (!axiosServiceInstance) {
    if (defaultConfig) {
      axiosServiceInstance = new AxiosService({
        baseURL: defaultConfig.baseURL,
        headers: defaultConfig.headers,
        timeout: defaultConfig.timeout,
        withCredentials: defaultConfig.withCredentials
      });
    } else {
      axiosServiceInstance = new AxiosService({
        baseURL: '',
        headers: {},
        timeout: 30000,
        withCredentials: false
      });
    }
  }
  return axiosServiceInstance.getAxiosInstance();
};
