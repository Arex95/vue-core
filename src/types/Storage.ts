/**
 * Storage Driver interface for framework-agnostic storage operations.
 * Drivers handle reading, writing, and removing data from different storage backends
 * (localStorage, sessionStorage, cookies) in both client and SSR contexts.
 */
export interface StorageDriver {
  /**
   * Retrieves a value from storage by key.
   * @param key - The storage key
   * @param context - Optional SSR context containing cookies, headers, etc.
   * @returns The stored value or null if not found
   */
  get(key: string, context?: StorageContext): string | null | Promise<string | null>;
  
  /**
   * Stores a value in storage.
   * @param key - The storage key
   * @param value - The value to store
   * @param options - Optional storage options (expires, path, domain, etc.)
   * @param context - Optional SSR context for writing response headers
   */
  set(key: string, value: string, options?: StorageOptions, context?: StorageContext): void | Promise<void>;
  
  /**
   * Removes a value from storage.
   * @param key - The storage key
   * @param options - Optional storage options
   * @param context - Optional SSR context
   */
  remove(key: string, options?: StorageOptions, context?: StorageContext): void | Promise<void>;
}

/**
 * SSR context passed to storage drivers.
 * Contains request/response information needed for SSR operations.
 */
export interface StorageContext {
  /** Parsed cookies from the request */
  cookies?: Record<string, string>;
  /** Request headers */
  headers?: Record<string, string>;
  /** Response headers (for writing cookies in SSR) */
  responseHeaders?: Headers | Record<string, string>;
  /** Allow framework-specific extensions without coupling */
  [key: string]: any;
}

/**
 * Options for storage operations, particularly for cookies.
 */
export interface StorageOptions {
  /** Expiration time in days */
  expires?: number;
  /** Max age in seconds */
  maxAge?: number;
  /** Cookie path */
  path?: string;
  /** Cookie domain */
  domain?: string;
  /** Secure flag (HTTPS only) */
  secure?: boolean;
  /** SameSite attribute */
  sameSite?: 'Strict' | 'Lax' | 'None';
  /** HttpOnly flag (server-side only) */
  httpOnly?: boolean;
}

/**
 * Strategy for handling redirects in SSR contexts.
 * Each framework can provide its own implementation.
 */
export interface RedirectStrategy {
  /**
   * Redirects to the specified path.
   * @param path - The path to redirect to
   */
  redirect(path: string): void | Promise<void>;
}

