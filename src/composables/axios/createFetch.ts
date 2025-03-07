import {AxiosInstance, AxiosRequestConfig} from 'axios'
import {UseQueryOptions} from '@tanstack/vue-query'
import AxiosService from '../../config/axios'
import {useEnv} from '../env'

const defaultAxiosInstance = new AxiosService(useEnv().api)
    .getAxiosInstance()

/**
 * Creates a fetchComposable for Axios requests with an optional custom instance.
 * @param fetchComposable - The composable to use for the request (can be any fetch function).
 * @param axiosInstance - An optional custom Axios instance to use for the request.
 * @returns A function that handles the request using the provided composable.
 */
export default function createFetch(
    fetchComposable: Function,
    axiosInstance?: AxiosInstance
) {
    const instance = axiosInstance || defaultAxiosInstance

    return (
        axiosRequestConfig: AxiosRequestConfig,
        options?: UseQueryOptions
    ) => {
        return fetchComposable(instance, axiosRequestConfig, options)
    };
}