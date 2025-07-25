import axios, {
    AxiosResponse,
    AxiosError,
    AxiosInstance,
    CancelTokenSource,
    InternalAxiosRequestConfig,
} from 'axios'

import { handleError } from '@utils/errors'
import { getTokenConfig } from '@/config/global/tokensConfig'
import { getEndpointsConfig } from '@config/global/endpointsConfig'

/**
 * AxiosService class encapsulates the Axios configuration and logic.
 * It manages request and response interceptors and provides methods for making HTTP requests.
 */
export class AxiosService {
    private readonly instance: AxiosInstance
    private cancelTokenSource: CancelTokenSource
    private activeRequests: number = 0
    private refreshTokenInProgress: boolean = false
    private readonly refreshTokenUrl: string

    /**
     * Initializes the AxiosService instance by creating an Axios instance with default configuration
     * and setting up request and response interceptors.
     */
    constructor(url: string, headers: Record<string, string> = {}) {
        this.cancelTokenSource = axios.CancelToken.source()

        this.instance = axios.create({
            baseURL: url ?? '',
            timeout: 300000,
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Expires': '0',
                ...headers,
            },
            withCredentials: false,
        })

        const endpointsConfig = getEndpointsConfig()
        this.refreshTokenUrl = endpointsConfig.REFRESH

        this.initializeInterceptors()
    }

    /**
     * Initializes request and response interceptors for the Axios instance.
     */
    private initializeInterceptors() {
        const { ACCESS_TOKEN, REFRESH_TOKEN } = getTokenConfig()

        this.instance.interceptors.request.use(
            (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
                const token = typeof window !== 'undefined' ? localStorage.getItem(ACCESS_TOKEN) : null
                if (token && config.headers) {
                    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`
                }
                config.cancelToken = this.cancelTokenSource.token
                this.activeRequests++
                return config
            },
            (error: AxiosError) => {
                handleError(error, false)
                this.activeRequests++
                return Promise.reject(error)
            }
        )

        this.instance.interceptors.response.use(
            (response: AxiosResponse) => {
                this.activeRequests--
                return response
            },
            async (error: AxiosError) => {
                this.activeRequests--

                // Check for unauthorized access (401)
                if (axios.isAxiosError(error) && error.response?.status === 401 && !this.refreshTokenInProgress) {
                    const refreshToken = localStorage.getItem(REFRESH_TOKEN)

                    if (refreshToken) {
                        this.refreshTokenInProgress = true
                        try {
                            // Attempt to refresh the token
                            const refreshResponse = await axios.post(this.refreshTokenUrl, { refreshToken })

                            const { token: newAccessToken } = refreshResponse.data
                            if (newAccessToken) {
                                // Save the new access token
                                localStorage.setItem(ACCESS_TOKEN, newAccessToken)

                                // Retry the original request with the new token
                                if (error.config && error.config.headers) {
                                    error.config.headers['Authorization'] = `Bearer ${newAccessToken}`
                                }
                                this.refreshTokenInProgress = false
                                if (error.config) {
                                    return this.instance(error.config)
                                }
                            }
                        } catch (refreshError) {
                            handleError(refreshError, false)
                            this.refreshTokenInProgress = false
                            localStorage.removeItem(ACCESS_TOKEN)
                            localStorage.removeItem(REFRESH_TOKEN)
                        }
                    }
                }

                handleError(error, false)
                return Promise.reject(error)
            }
        )
    }

    /**
     * Returns the number of active requests.
     */
    public getActiveRequests(): number {
        return this.activeRequests
    }

    /**
     * Returns the Axios instance with the configured settings and interceptors.
     * @returns {AxiosInstance} The configured Axios instance.
     */
    public getAxiosInstance(): AxiosInstance {
        return this.instance
    }

    /**
     * Cancels all ongoing requests.
     */
    public cancelAllRequests() {
        this.cancelTokenSource.cancel('Operation canceled by the user.')
        this.cancelTokenSource = axios.CancelToken.source()
    }

    /**
     * Sets a new header for the Axios instance.
     * @param {string} key - The header key.
     * @param {string} value - The header value.
     */
    public setHeader(key: string, value: string) {
        this.instance.defaults.headers.common[key] = value
    }

    /**
     * Removes a header from the Axios instance.
     * @param {string} key - The header key to remove.
     */
    public removeHeader(key: string) {
        delete this.instance.defaults.headers.common[key]
    }
}