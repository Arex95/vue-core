import { $fetch, FetchOptions } from 'ofetch';
import { Fetcher, FetcherConfig } from '../types/Fetcher';

/**
 * Creates a fetcher function using ofetch.
 * 
 * @param baseURL - Optional base URL for requests
 * @param defaultOptions - Optional default options for ofetch
 * @returns A fetcher function compatible with RestStd
 * 
 * @example
 * ```typescript
 * import { createOfetchFetcher, RestStd } from '@arex95/vue-core';
 * 
 * export class Role extends RestStd {
 *     static override resource = 'roles';
 *     static fetchFn = createOfetchFetcher('https://api.example.com');
 * }
 * ```
 * 
 * @example
 * ```typescript
 * import { createFetch } from 'ofetch';
 * import { createOfetchFetcher, RestStd } from '@arex95/vue-core';
 * 
 * const ofetchInstance = createFetch({ baseURL: 'https://api.example.com' });
 * 
 * export class Role extends RestStd {
 *     static override resource = 'roles';
 *     static fetchFn = createOfetchFetcher(undefined, { fetch: ofetchInstance });
 * }
 * ```
 */
export function createOfetchFetcher(
    baseURL?: string,
    defaultOptions?: FetchOptions
): Fetcher {
    return async (config: FetcherConfig): Promise<any> => {
        const url = baseURL 
            ? `${baseURL.replace(/\/$/, '')}/${config.url.replace(/^\//, '')}`
            : config.url;
        
        return $fetch(url, {
            method: config.method as any,
            query: config.params,
            body: config.data,
            headers: config.headers,
            ...defaultOptions,
        });
    };
}

