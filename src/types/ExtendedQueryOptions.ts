import { UseQueryOptions } from '@tanstack/vue-query'

/**
 * Extends the standard `UseQueryOptions` from Vue Query with additional properties
 * to control server-side execution and provide a custom query key.
 */
export type ExtendedQueryOptions = {
  /** The standard Vue Query options object. */
  options?: UseQueryOptions;
  /**
   * If `false`, the query will not be executed on the server during server-side rendering (SSR).
   * @default true
   */
  server?: boolean;
  /** An optional custom query key to override the default key generation. */
  queryKey?: string;
};