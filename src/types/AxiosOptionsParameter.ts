import { MaybeRef } from 'vue';
import { AxiosRequestConfig } from 'axios';

/**
 * Defines a set of advanced options for controlling the behavior of an Axios-based fetch request.
 * This includes features like immediate execution, default values, debouncing, and retry logic.
 *
 * @template T The expected type of the `defaultValue`.
 */
export type AxiosOptionsParameter<T = any> = {
  /**
   * If `true`, the request is executed immediately upon creation. Can be a reactive `Ref`.
   * @default false
   */
  immediate?: MaybeRef<boolean>;

  /**
   * A default value to be used for the response data before the request completes or if it fails.
   */
  defaultValue?: T;

  /**
   * Additional Axios-specific configuration for the request, such as headers, params, etc.
   */
  axiosOptionFetch?: AxiosRequestConfig;

  /**
   * The debounce interval in milliseconds. If provided, the request will be delayed until
   * this amount of time has passed without any new calls.
   */
  debounce?: number;

  /**
   * The maximum number of times to retry the request if it fails.
   * @default 0
   */
  maxRetries?: number;

  /**
   * The delay in milliseconds between retry attempts.
   * @default 1000
   */
  retryDelay?: number;
};