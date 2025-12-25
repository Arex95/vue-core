import axios, {
  AxiosResponse,
  AxiosError,
  AxiosInstance,
  CancelTokenSource,
  InternalAxiosRequestConfig,
} from "axios";

import { AxiosServiceOptions } from "@/types/AxiosServiceOptions";
import { getAuthToken } from "@/services/credentials";

import { getAppKey } from "@/config/global";
import { handleError } from "@utils/errors";
import { getEndpointsConfig } from "@config/global/endpointsConfig";

import { refreshTokens } from "@/services";
import { createAxiosFetcher } from "@/fetchers/axios";
import { UniversalStorage } from "@/utils/storage/UniversalStorage";

declare module "axios" {
  interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

/**
 * A service class that encapsulates a customizable Axios instance with built-in interceptors
 * for handling authentication, token refreshing, and request cancellation. It is designed to
 * streamline API communication by automatically attaching authorization headers and managing
 * token refresh logic for 401 Unauthorized responses.
 */
export class AxiosService {
  private readonly instance: AxiosInstance;
  private cancelTokenSource: CancelTokenSource;
  private activeRequests: number = 0;
  private readonly refreshTokenUrl: string;
  private readonly storageFactory?: () => UniversalStorage;

  private isRefreshing = false;
  private failedQueue: {
    resolve: (value: string) => void;
    reject: (reason: AxiosError | Error) => void;
  }[] = [];

  /**
   * Creates an instance of AxiosService.
   * @param {AxiosServiceOptions} options - Configuration options for the Axios instance, such as `baseURL`, `timeout`, and custom `headers`.
   */
  constructor(options: AxiosServiceOptions) {
    this.storageFactory = options.storageFactory;
    this.cancelTokenSource = axios.CancelToken.source();

    const endpointsConfig = getEndpointsConfig();
    this.refreshTokenUrl = endpointsConfig.REFRESH;

    this.instance = axios.create({
      baseURL: options.baseURL ?? "",
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

  private processQueue(
    error: AxiosError | null,
    token: string | null = null
  ): void {
    this.failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else if (token) {
        prom.resolve(token);
      }
    });
    this.failedQueue = [];
  }

  private setAuthHeader(
    config: InternalAxiosRequestConfig,
    token: string
  ): void {
    if (config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  private initializeInterceptors() {
    this.instance.interceptors.request.use(
      async (
        config: InternalAxiosRequestConfig
      ): Promise<InternalAxiosRequestConfig> => {
        // Usar storage factory si está disponible (SSR), sino usar método tradicional
        let token: string | null = null;
        if (this.storageFactory) {
          const storage = this.storageFactory();
          token = await storage.getDecrypted('ACCESS_TOKEN');
        } else {
          token = await getAuthToken(getAppKey(), "any");
        }
        
        if (token) {
          this.setAuthHeader(config, token);
        }
        config.cancelToken = this.cancelTokenSource.token;
        this.activeRequests++;
        return config;
      },
      (error: AxiosError) => {
        handleError(error);
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

        const isAuthError =
          axios.isAxiosError(error) && error.response?.status === 401;
        const isRefreshCall = originalRequest?.url === this.refreshTokenUrl;
        const isRetry = originalRequest?._retry === true;

        if (!isAuthError || isRefreshCall || isRetry) {
          handleError(error);
          return Promise.reject(error);
        }

        if (!originalRequest) {
          handleError(error);
          return Promise.reject(error);
        }

        if (this.isRefreshing) {
          return new Promise<string>((resolve, reject) => {
            this.failedQueue.push({ resolve, reject });
          })
            .then((newToken) => {
              this.setAuthHeader(originalRequest, newToken);
              return this.instance(originalRequest);
            })
            .catch((err) => {
              return Promise.reject(err);
            });
        }

        this.isRefreshing = true;
        originalRequest._retry = true;

        try {
          const fetcher = createAxiosFetcher(this.instance);
          // Usar storage factory si está disponible (SSR), sino usar método tradicional
          const storage = this.storageFactory ? this.storageFactory() : undefined;
          await refreshTokens(fetcher, storage);
          
          // Obtener nuevo token usando el mismo método
          let newToken: string | null = null;
          if (this.storageFactory) {
            const refreshedStorage = this.storageFactory();
            newToken = await refreshedStorage.getDecrypted('ACCESS_TOKEN');
          } else {
            newToken = await getAuthToken(getAppKey(), "any");
          }

          if (newToken) {
            this.processQueue(null, newToken);
            this.setAuthHeader(originalRequest, newToken);
          } else {
            const refreshError = new Error(
              "New token not found after refresh."
            );
            this.processQueue(refreshError as AxiosError, null);
            throw refreshError;
          }

          this.isRefreshing = false;
          return this.instance(originalRequest);
        } catch (refreshError) {
          this.processQueue(refreshError as AxiosError, null);
          this.isRefreshing = false;
          handleError(refreshError);
          return Promise.reject(error);
        }
      }
    );
  }

  /**
   * Returns the number of active (in-flight) requests.
   * @returns {number} The number of active requests.
   */
  public getActiveRequests(): number {
    return this.activeRequests;
  }

  /**
   * Returns the underlying Axios instance.
   * @returns {AxiosInstance} The Axios instance.
   */
  public getAxiosInstance(): AxiosInstance {
    return this.instance;
  }

  /**
   * Cancels all ongoing requests made by this Axios instance.
   */
  public cancelAllRequests() {
    this.cancelTokenSource.cancel("Operation canceled by the user.");
    this.cancelTokenSource = axios.CancelToken.source();
  }

  /**
   * Sets a default header for all subsequent requests.
   * @param {string} key - The header key.
   * @param {string} value - The header value.
   */
  public setHeader(key: string, value: string) {
    this.instance.defaults.headers.common[key] = value;
  }

  /**
   * Removes a default header.
   * @param {string} key - The header key to remove.
   */
  public removeHeader(key: string) {
    delete this.instance.defaults.headers.common[key];
  }
}
