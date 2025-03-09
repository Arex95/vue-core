import axios, {
    AxiosResponse,
    AxiosError,
    AxiosInstance,
    CancelTokenSource,
    InternalAxiosRequestConfig,
} from 'axios';

/**
 * AxiosService class encapsulates the Axios configuration and logic.
 * It manages request and response interceptors and provides methods for making HTTP requests.
 */
export class AxiosService {
    private readonly instance: AxiosInstance;
    private cancelTokenSource: CancelTokenSource;
    private activeRequests: number = 0; // Track active requests

    /**
     * Initializes the AxiosService instance by creating an Axios instance with default configuration
     * and setting up request and response interceptors.
     */
    constructor(url: string, headers: Record<string, string> = {}) {
        this.cancelTokenSource = axios.CancelToken.source();

        this.instance = axios.create({
            baseURL: url ?? '',
            timeout: 300000,
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
                ...headers,
            },
            withCredentials: false,
        });

        this.initializeInterceptors();
    }

    /**
     * Initializes request and response interceptors for the Axios instance.
     */
    private initializeInterceptors() {
        this.instance.interceptors.request.use(
            (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
                const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
                if (token && config.headers) {
                    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
                }
                config.cancelToken = this.cancelTokenSource.token;
                this.activeRequests++;
                return config;
            },
            (error: AxiosError) => {
                console.error('Request error:', error.message);
                this.activeRequests++;
                return Promise.reject(error);
            }
        );

        this.instance.interceptors.response.use(
            (response: AxiosResponse) => {
                this.activeRequests--;
                return response;
            },
            (error: unknown) => {
                if (axios.isCancel(error)) {
                    console.warn('Request canceled:', (error as AxiosError).message);
                } else if (axios.isAxiosError(error)) {
                    console.error('Response error:', error.response?.status, error.message);
                    if (error.response?.status === 401) {
                        this.handleUnauthorized();
                    }
                } else {
                    console.error('Unexpected error:', error);
                }
                this.activeRequests--;
                return Promise.reject(error);
            }
        );
    }

    /**
     * Returns the number of active requests.
     */
    public getActiveRequests(): number {
        return this.activeRequests;
    }

    /**
     * Handles unauthorized access errors (401).
     */
    private handleUnauthorized() {
        console.warn('Unauthorized access - redirecting to login.');
    }

    /**
     * Returns the Axios instance with the configured settings and interceptors.
     * @returns {AxiosInstance} The configured Axios instance.
     */
    public getAxiosInstance(): AxiosInstance {
        return this.instance;
    }

    /**
     * Cancels all ongoing requests.
     */
    public cancelAllRequests() {
        this.cancelTokenSource.cancel('Operation canceled by the user.');
        this.cancelTokenSource = axios.CancelToken.source();
    }

    /**
     * Sets a new header for the Axios instance.
     * @param {string} key - The header key.
     * @param {string} value - The header value.
     */
    public setHeader(key: string, value: string) {
        this.instance.defaults.headers.common[key] = value;
    }

    /**
     * Removes a header from the Axios instance.
     * @param {string} key - The header key to remove.
     */
    public removeHeader(key: string) {
        delete this.instance.defaults.headers.common[key];
    }
}