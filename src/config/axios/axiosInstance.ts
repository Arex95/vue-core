import { AxiosService } from '@config/axios/axiosConfig';

let axiosInstance: AxiosService;

export const configureAxios = (baseURL: string): void => {
  axiosInstance = new AxiosService(baseURL);
};

export const getAxiosInstance = () => {
  if (!axiosInstance) {
    throw new Error('Axios instance not configured. Call configureAxios first.');
  }
  return axiosInstance.getAxiosInstance();
};