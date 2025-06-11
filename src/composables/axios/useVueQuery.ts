import { useQuery, UseQueryOptions } from '@tanstack/vue-query'
import { AxiosInstance, AxiosRequestConfig } from 'axios'
import { ref, watch, onMounted } from 'vue'
import { onServerPrefetch } from 'vue'
import type { ExtendedQueryOptions } from '../../types'

/**
 * Custom composable for integrating Axios requests with Vue Query.
 *
 * @template T - The type of data expected from the query.
 * @param {AxiosInstance} axios - Axios instance used for making HTTP requests.
 * @param {AxiosRequestConfig} axiosRequest - Initial Axios request configuration.
 * @param {ExtendedQueryOptions<T>} [queryOptions] - Optional Vue Query options with server execution flag.
 * @returns {object} Composable functions and query state for managing API requests.
 */
export function useVueQuery<T>(
  axios: AxiosInstance,
  axiosRequest: AxiosRequestConfig,
  queryOptions?: ExtendedQueryOptions
) {
  const key = ref<Array<any>>([
    queryOptions?.queryKey || `${axiosRequest.url}-${JSON.stringify(axiosRequest)}`
  ])
  const axiosRequestRef = ref<AxiosRequestConfig>(axiosRequest)
  const queryOptionsRef = ref<ExtendedQueryOptions | undefined>(queryOptions)
  const isInitialized = ref<boolean>(false)
  const errorCallbacks = ref<((e: unknown) => void)[]>([])
  const resultCallbacks = ref<((data: T) => void)[]>([])

  /**
   * Vue Query instance for managing API requests.
   */
  const query = useQuery<T, unknown>({
    queryKey: key.value,
    queryFn: async (): Promise<T> => {
      const response = await axios(axiosRequestRef.value)
      return response.data as T
    },
    ...((queryOptionsRef.value?.options as UseQueryOptions<T, unknown>) ?? {})
  })

  /**
   * Executes the query manually with optional new key and request parameters.
   *
   * @param {Array<any>} [newKey] - New query key to use.
   * @param {object} [newRequestParams] - New request parameters to use.
   * @param {ExtendedQueryOptions<T>} [newQueryOptions] - New Vue Query options to use.
   */
  function execute(
    newKey?: Array<any>,
    newRequestParams?: object,
    newQueryOptions?: ExtendedQueryOptions
  ) {
    if (newKey) {
      key.value = newKey
    }
    if (newRequestParams) {
      axiosRequestRef.value.data = newRequestParams
    }
    if (newQueryOptions) {
      queryOptionsRef.value = newQueryOptions
    }
    query.refetch()
  }

  /**
   * Registers a callback to be executed on successful request result.
   * If data is already available, the callback will be executed immediately.
   *
   * @param {(data: T) => void} cb - Callback function to handle the result.
   */
  function onResult(cb: (data: T) => void) {
    resultCallbacks.value.push(cb)
    if (query.data.value !== undefined && query.data.value !== null) {
      cb(query.data.value as T)
    }
  }

  /**
   * Registers a callback to be executed when the request results in an error.
   * If an error is already present, the callback will be executed immediately.
   *
   * @param {(e: unknown) => void} callback - Callback function to handle errors.
   */
  function onError(callback: (e: unknown) => void) {
    errorCallbacks.value.push(callback)
    if (query.error.value !== undefined) {
      callback(query.error.value)
    }
  }

  /**
   * Watches for changes in the query result and triggers result callbacks.
   */
  watch(query.data, (newData) => {
    if (newData !== undefined && newData !== null && isInitialized.value) {
      resultCallbacks.value.forEach((cb) => cb(newData as T))
    }
  })

  /**
   * Watches for changes in query errors and triggers error callbacks.
   */
  watch(query.error, (newError) => {
    if (newError !== undefined && isInitialized.value) {
      errorCallbacks.value.forEach((cb) => cb(newError))
    }
  })

  /**
   * Handles server-side prefetching for SSR.
   * Ensures data is fetched before rendering on the server.
   */
  onServerPrefetch(async () => {
    if (queryOptionsRef.value?.server !== false) {
      await query.suspense()
      if (query.data.value != null) {
        resultCallbacks.value.forEach((cb) => cb(query.data.value as T))
      }
    }
  })

  /**
   * Ensures callbacks are executed after the component is mounted on the client-side.
   */
  onMounted(() => {
    isInitialized.value = true
    if (query.data.value != null) {
      resultCallbacks.value.forEach((cb) => cb(query.data.value as T))
    }
    if (query.error.value !== undefined) {
      errorCallbacks.value.forEach((cb) => cb(query.error.value))
    }
  })

  return {
    execute,
    onResult,
    onError,
    ...query
  }
}