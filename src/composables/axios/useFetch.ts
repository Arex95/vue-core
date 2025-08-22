import { AxiosInstance, AxiosRequestConfig } from 'axios'
import { UseQueryOptions } from '@tanstack/vue-query'
import { getConfiguredAxiosInstance } from "@config/axios";

/**
 * Creates a fetchFn for Axios requests with an optional custom instance.
 * @param fetchComposable - The fn to use for the request (can be any fetch function).
 * @param axiosCustomInstance - An optional custom Axios instance to use for the request.
 * @returns A function that handles the request using the provided fn.
 */
export function useFetch(
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