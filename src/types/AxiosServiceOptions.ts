import { UniversalStorage } from "@/utils/storage/UniversalStorage";

/**
 * Defines the configuration options for creating a new `AxiosService` instance.
 * This interface allows for setting the base URL, default headers, request timeout,
 * and credential handling for all requests made by the instance.
 */
export interface AxiosServiceOptions {
  /** The base URL that will be prepended to all request URLs. */
  baseURL: string;
  /** A record of default headers to be sent with every request. */
  headers?: Record<string, string>;
  /** The request timeout in milliseconds. */
  timeout?: number;
  /** A boolean indicating whether cross-site Access-Control requests should be made using credentials. */
  withCredentials?: boolean;
  /** Optional factory function to create UniversalStorage instances for SSR token refresh */
  storageFactory?: () => UniversalStorage;
}
