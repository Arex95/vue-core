import { AxiosService } from '@config/axios/axiosConfig';
import { AxiosInstance } from 'axios';

let axiosInstance: AxiosService;

/**
 * Configures the global Axios instance with a base URL.
 * @param {string} baseURL - The base URL for the Axios instance.
 */
export const configAxios = (baseURL: string): void => {
  axiosInstance = new AxiosService(baseURL);
};

/**
 * Retrieves the configured Axios instance.
 * @returns {AxiosService} The configured Axios instance.
 * @throws Will throw an error if the Axios instance is not configured.
 */
export const getAxiosInstance = () => {
  if (!axiosInstance) {
    throw new Error('Axios instance not configured. Call configureAxios first.');
  }
  return axiosInstance.getAxiosInstance();
};

/**
 * Creates a new AxiosService instance with custom headers.
 * @param {string} baseURL - The base URL for the Axios instance.
 * @param {Record<string, string>} headers - Custom headers to set.
 * @returns {AxiosService} The new AxiosService instance.
 */
export const createCustomAxiosInstance = (baseURL: string, headers: Record<string, string>): AxiosInstance => {
  return new AxiosService(baseURL, headers).getAxiosInstance();
};