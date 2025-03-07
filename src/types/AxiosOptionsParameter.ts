import { MaybeRef } from 'vue';
import { AxiosRequestConfig } from 'axios';

/**
 * Type for options passed to an Axios fetch request.
 */
export type AxiosOptionsParameter<T = any> = {
  /**
   * A boolean or a reactive reference to a boolean indicating if the request is enabled by default.
   */
  immediate?: MaybeRef<boolean>;

  /**
   * A default value to be used if the request does not return data.
   */
  defaultValue?: T;

  /**
   * Axios configuration options for the request.
   */
  axiosOptionFetch?: AxiosRequestConfig;

  /**
   * Delay in milliseconds to debounce the request.
   */
  debounce?: number;

  /**
   * Maximum number of retries for the request on failure.
   */
  maxRetries?: number;

  /**
   * Delay in milliseconds between retry attempts.
   */
  retryDelay?: number;
};