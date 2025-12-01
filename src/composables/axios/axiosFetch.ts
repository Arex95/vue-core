import { AxiosInstance, AxiosRequestConfig } from 'axios';
/**
 * A composable function that executes an Axios request and returns the response data.
 * It simplifies making API calls by wrapping the Axios request in a reusable function.
 *
 * @template T The expected type of the response data.
 * @param {AxiosInstance} axios - The Axios instance to use for making the request.
 * @param {AxiosRequestConfig} axiosRequest - The configuration for the Axios request (e.g., URL, method, headers).
 * @returns {Promise<T>} A promise that resolves with the data from the Axios response.
 * @throws {Error} Throws an error if the Axios request fails.
 */
export async function axiosFetch<T>(
    axios: AxiosInstance,
    axiosRequest: AxiosRequestConfig
): Promise<T> {
    return axios(axiosRequest)
        .then(response => response.data as T)
        .catch(error => {
            throw error;
        });
}