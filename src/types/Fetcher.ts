/**
 * Configuration object for making HTTP requests.
 * This interface is agnostic of any specific HTTP library.
 */
export interface FetcherConfig {
    /** HTTP method (GET, POST, PUT, DELETE, PATCH, etc.) */
    method: string;
    /** URL endpoint (can be relative or absolute) */
    url: string;
    /** Query parameters (will be converted to query string) */
    params?: Record<string, any>;
    /** Request body data */
    data?: any;
    /** HTTP headers */
    headers?: Record<string, string>;
}

/**
 * A generic fetcher function that accepts FetcherConfig and returns a Promise.
 * This function is agnostic of any specific HTTP library (axios, ofetch, fetch, etc.).
 * 
 * @param config - The request configuration
 * @returns A promise that resolves with the response data
 */
export type Fetcher = (config: FetcherConfig) => Promise<any>;

