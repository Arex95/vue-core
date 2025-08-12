import { AxiosService } from "@config/axios/axiosConfig";
import { AxiosInstance } from "axios";
import { useAuth } from "@/composables/auth/useAuth";

let axiosInstance: AxiosService;
const auth = useAuth();

interface AxiosConfig {
  baseURL: string;
}

interface CustomAxiosConfig {
  baseURL: string;
  headers?: Record<string, string>;
}

const refreshAndForget = async () => {
  await auth.refresh();
};

export const configAxios = (config: AxiosConfig): void => {
  axiosInstance = new AxiosService(
    {
      baseURL: config.baseURL,
    },
    refreshAndForget
  );
};

export const getAxiosInstance = () => {
  if (!axiosInstance) {
    throw new Error("Axios instance not configured. Call configAxios first.");
  }
  return axiosInstance.getAxiosInstance();
};

export const createCustomAxiosInstance = (
  config: CustomAxiosConfig
): AxiosInstance => {
  return new AxiosService(
    {
      baseURL: config.baseURL,
      headers: config.headers,
    },
    refreshAndForget
  ).getAxiosInstance();
};
