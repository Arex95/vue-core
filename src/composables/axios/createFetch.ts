import { AxiosInstance, AxiosRequestConfig } from 'axios'
import { UseQueryOptions } from '@tanstack/vue-query'
import { AxiosService } from '@config/axios'

/**
 * Creates a fetchComposable for Axios requests with an optional custom instance.
 * @param fetchComposable - The composable to use for the request (can be any fetch function).
 * @param apiUrl - The base URL for the Axios instance.
 * @param axiosInstance - An optional custom Axios instance to use for the request.
 * @returns A function that handles the request using the provided composable.
 */
export function createFetch(
    fetchComposable: Function,
    apiUrl: string,
    axiosInstance?: AxiosInstance
) {
    const instance = axiosInstance || new AxiosService(apiUrl).getAxiosInstance()

    return (
        axiosRequestConfig: AxiosRequestConfig,
        options?: UseQueryOptions
    ) => {
        return fetchComposable(instance, axiosRequestConfig, options)
    };
}