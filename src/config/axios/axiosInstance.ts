import { AxiosService } from "@config/axios/axiosConfig";
import { AxiosServiceOptions } from "@/types/AxiosServiceOptions";
import { AxiosInstance } from "axios";

let axiosServiceInstance: AxiosService;

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

export const getConfiguredAxiosInstance = (): AxiosInstance => {
  if (!axiosServiceInstance) {
    throw new Error("Axios instance not configured. Call configAxios first.");
  }
  return axiosServiceInstance.getAxiosInstance();
};
