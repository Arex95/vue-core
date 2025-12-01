import { AxiosInstance, AxiosRequestConfig } from 'axios'
import { UseQueryOptions } from '@tanstack/vue-query'
import { getConfiguredAxiosInstance } from "@config/axios";

/**
 * A factory function that creates a reusable query function for making API requests.
 * It abstracts the Axios instance creation and allows for a custom instance to be provided.
 * This is particularly useful for creating typed query functions for use with libraries like Vue Query.
 *
 * @template TQueryFnData The expected data type of the query function's response.
 * @template TData The expected data type of the transformed data.
 * @param {Function} fetchFn - The underlying function that will be called to perform the fetch operation.
 *   This function should accept an Axios instance, Axios request configuration, and optional query options.
 * @param {AxiosInstance} [axiosCustomInstance] - An optional custom Axios instance to use for the request.
 *   If not provided, a default configured instance will be used.
 * @returns {(axiosRequestConfig: AxiosRequestConfig, options?: UseQueryOptions<TQueryFnData, Error, TData>) => any}
 *   A new function that takes Axios request configuration and optional query options, and when executed,
 *   performs the API request using the configured `fetchFn`.
 */
export function useFetch<TQueryFnData = unknown, TData = TQueryFnData>(
    fetchFn: Function,
    axiosCustomInstance?: AxiosInstance
) {
    const instance = axiosCustomInstance || getConfiguredAxiosInstance();
    return (
        axiosRequestConfig: AxiosRequestConfig,
        options?: UseQueryOptions
    ) => {
        return fetchFn(instance, axiosRequestConfig, options)
    };
}