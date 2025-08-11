export interface AxiosServiceOptions {
  baseURL: string;
  headers?: Record<string, string>;
  timeout?: number;
  withCredentials?: boolean;
}
