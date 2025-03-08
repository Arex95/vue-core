import { AxiosInstance, AxiosRequestConfig } from 'axios';
/**
 * Custom composable function for making API requests with Axios.
 *
 * @template T The expected return type of the API request.
 * @param {AxiosInstance} axios - The Axios instance for making HTTP requests.
 * @param {AxiosRequestConfig} axiosRequest - Configuration for the Axios request.
 * @returns {Promise<T>} A promise with the result of the API request.
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