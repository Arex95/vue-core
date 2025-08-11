import axios, {
    AxiosResponse,
    AxiosError,
    AxiosInstance,
    CancelTokenSource,
    InternalAxiosRequestConfig,
} from 'axios'

import {
    AxiosServiceOptions
} from '@/types/AxiosServiceOptions';

import {
    getAuthToken
} from "@utils/credentials";

import { getAppKey } from "@/config";
import { handleError } from '@utils/errors'
import { getEndpointsConfig } from '@config/global/endpointsConfig'
import { useAuth } from '@/composables/auth/useAuth'

export class AxiosService {
  private readonly instance: AxiosInstance;
  private cancelTokenSource: CancelTokenSource;
  private activeRequests: number = 0;
  private refreshTokenPromise: Promise<void> | null = null;
  private readonly refreshTokenUrl: string;
  private readonly auth = useAuth();

  constructor(options: AxiosServiceOptions) {
    this.cancelTokenSource = axios.CancelToken.source();

    const endpointsConfig = getEndpointsConfig();
    this.refreshTokenUrl = endpointsConfig.REFRESH;

    this.instance = axios.create({
      baseURL: options.baseURL ?? '',
      timeout: options.timeout ?? 30000,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...options.headers,
      },
      withCredentials: options.withCredentials ?? false,
    });

    this.initializeInterceptors();
  }

    private initializeInterceptors() {
      
    this.instance.interceptors.request.use(
      async (
        config: InternalAxiosRequestConfig
      ): Promise<InternalAxiosRequestConfig> => {
        const token = await getAuthToken(getAppKey(), "any");
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        config.cancelToken = this.cancelTokenSource.token;
        this.activeRequests++;
        return config;
      },
      (error: AxiosError) => {
        handleError(error, false);
        return Promise.reject(error);
      }
    );

    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        this.activeRequests--;
        return response;
      },
      async (error: AxiosError) => {
        this.activeRequests--;
        const originalRequest = error.config;

        if (
          axios.isAxiosError(error) &&
          error.response?.status === 401 &&
          originalRequest &&
          originalRequest.url !== this.refreshTokenUrl
        ) {
          if (!this.refreshTokenPromise) {
            this.refreshTokenPromise = this.auth
              .refresh()
              .then(() => {})
              .finally(() => {
                this.refreshTokenPromise = null;
              });
          }

          try {
            await this.refreshTokenPromise;
            const newToken = await getAuthToken(getAppKey(), "any");
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return this.instance(originalRequest);
          } catch (refreshError) {
            handleError(refreshError, false);
            return Promise.reject(error);
          }
        }

        handleError(error, false);
        return Promise.reject(error);
      }
    );
  }

  public getActiveRequests(): number {
    return this.activeRequests;
  }

  public getAxiosInstance(): AxiosInstance {
    return this.instance;
  }

  public cancelAllRequests() {
    this.cancelTokenSource.cancel("Operation canceled by the user.");
    this.cancelTokenSource = axios.CancelToken.source();
  }

  public setHeader(key: string, value: string) {
    this.instance.defaults.headers.common[key] = value;
  }

  public removeHeader(key: string) {
    delete this.instance.defaults.headers.common[key];
  }
}
