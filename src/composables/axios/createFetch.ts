import { AxiosInstance, AxiosRequestConfig } from 'axios'
import { UseQueryOptions } from '@tanstack/vue-query'
import { getAxiosInstance } from '@config/axios'

/**
 * Creates a fetchComposable for Axios requests with an optional custom instance.
 * @param fetchComposable - The composable to use for the request (can be any fetch function).
 * @param axiosCustomInstance - An optional custom Axios instance to use for the request.
 * @returns A function that handles the request using the provided composable.
 */
export function createFetch(
    fetchComposable: Function,
    axiosCustomInstance?: AxiosInstance
) {
    const instance = axiosCustomInstance || getAxiosInstance()
    return (
        axiosRequestConfig: AxiosRequestConfig,
        options?: UseQueryOptions
    ) => {
        return fetchComposable(instance, axiosRequestConfig, options)
    };
}