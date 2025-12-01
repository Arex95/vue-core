import { Fetcher } from '@/types/Fetcher';
import { createAxiosFetcher } from '@/fetchers/axios';
import { getConfiguredAxiosInstance } from '@/config/axios/axiosInstance';

let defaultAuthFetcher: Fetcher | null = null;

/**
 * Configures a default fetcher for authentication operations.
 * If not configured, useAuth will use the default Axios fetcher.
 * 
 * @param fetcher - The fetcher function to use for auth operations
 * 
 * @example
 * ```typescript
 * import { configAuthFetcher, createOfetchFetcher } from '@arex95/vue-core';
 * 
 * const ofetchFetcher = createOfetchFetcher();
 * configAuthFetcher(ofetchFetcher);
 * ```
 */
export function configAuthFetcher(fetcher: Fetcher): void {
  defaultAuthFetcher = fetcher;
}

/**
 * Gets the default auth fetcher, creating one from Axios if not configured.
 * This allows lazy initialization to avoid circular dependencies.
 * 
 * @returns The fetcher function to use
 */
export function getDefaultAuthFetcher(): Fetcher {
  if (defaultAuthFetcher) {
    return defaultAuthFetcher;
  }
  const axiosInstance = getConfiguredAxiosInstance();
  return createAxiosFetcher(axiosInstance);
}

