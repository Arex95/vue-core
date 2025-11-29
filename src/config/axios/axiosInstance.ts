import { AxiosService } from "@config/axios/axiosConfig";
import { AxiosServiceOptions } from "@/types/AxiosServiceOptions";
import { AxiosInstance } from "axios";

let axiosServiceInstance: AxiosService;

/**
 * Configures the singleton Axios service instance for the application.
 * This function should be called once at the application's entry point to set up
 * the base URL, headers, and other default configurations for all API requests.
 *
 * @param {AxiosServiceOptions} config - The configuration options for the Axios service.
 */
export const configAxios = (config: AxiosServiceOptions): void => {
  axiosServiceInstance = new AxiosService(
    {
      baseURL: config.baseURL,
      headers: config.headers,
      timeout: config.timeout,
      withCredentials: config.withCredentials
    }
  );
};

/**
 * Retrieves the configured singleton Axios instance.
 * It ensures that the instance has been configured by `configAxios` before being used.
 *
 * @returns {AxiosInstance} The configured Axios instance.
 * @throws {Error} If `configAxios` has not been called before this function is invoked.
 */
export const getConfiguredAxiosInstance = (): AxiosInstance => {
  if (!axiosServiceInstance) {
    throw new Error("Axios instance not configured. Call configAxios first.");
  }
  return axiosServiceInstance.getAxiosInstance();
};
