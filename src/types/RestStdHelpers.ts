import { RetryConfig } from '@/utils/retry';
import { Fetcher } from './Fetcher';

// ==========================================
// API Response Types
// ==========================================

/**
 * Generic paginated API response wrapper.
 * @template T The type of items in the data array
 */
export interface PaginatedResponse<T> {
  /** Array of items */
  data: T[];
  /** Pagination metadata */
  meta: {
    /** Current page number */
    currentPage: number;
    /** Number of items per page */
    perPage: number;
    /** Total number of items */
    total: number;
    /** Total number of pages */
    totalPages: number;
    /** Whether there is a next page */
    hasNextPage: boolean;
    /** Whether there is a previous page */
    hasPreviousPage: boolean;
  };
}

/**
 * Generic single item API response wrapper.
 * @template T The type of the item
 */
export interface SingleResponse<T> {
  /** The item data */
  data: T;
  /** Optional message from the server */
  message?: string;
}

/**
 * Generic list API response wrapper (non-paginated).
 * @template T The type of items in the data array
 */
export interface ListResponse<T> {
  /** Array of items */
  data: T[];
  /** Optional total count */
  total?: number;
  /** Optional message from the server */
  message?: string;
}

/**
 * Generic API error response.
 */
export interface ErrorResponse {
  /** Error message */
  message: string;
  /** Error code */
  code?: string;
  /** HTTP status code */
  statusCode?: number;
  /** Field-specific errors for validation */
  errors?: Record<string, string[]>;
  /** Additional error details */
  details?: Record<string, unknown>;
}

/**
 * Generic mutation response (create, update, delete).
 * @template T The type of the affected item
 */
export interface MutationResponse<T = unknown> {
  /** The created/updated item (if applicable) */
  data?: T;
  /** Success message */
  message?: string;
  /** Whether the operation was successful */
  success: boolean;
}

// ==========================================
// RestStd Configuration Types
// ==========================================

/**
 * Static configuration for a RestStd subclass.
 */
export interface RestStdConfig {
  /** The API resource endpoint (e.g., 'users', 'posts') */
  resource: string;
  /** Whether to send requests as FormData */
  isFormData?: boolean;
  /** Global headers for all requests */
  headers?: Record<string, string>;
  /** Custom fetcher function */
  fetchFn?: Fetcher;
  /** Retry configuration for failed requests */
  retryConfig?: RetryConfig;
}

/**
 * Type helper for creating a typed RestStd model.
 * @template TModel The model type
 * @template TCreateData The data type for create operations
 * @template TUpdateData The data type for update operations
 */
export interface RestStdModel<
  TModel,
  TCreateData = Partial<TModel>,
  TUpdateData = Partial<TModel>
> {
  /** Get all items */
  getAll<TResponse = ListResponse<TModel>>(): Promise<TResponse>;
  /** Get a single item by ID */
  getOne<TResponse = SingleResponse<TModel>>(options: { id: string | number }): Promise<TResponse>;
  /** Create a new item */
  create<TResponse = SingleResponse<TModel>>(options: { data: TCreateData }): Promise<TResponse>;
  /** Update an existing item */
  update<TResponse = SingleResponse<TModel>>(options: { id: string | number; data: TUpdateData }): Promise<TResponse>;
  /** Partially update an existing item */
  patch<TResponse = SingleResponse<TModel>>(options: { id: string | number; data: Partial<TUpdateData> }): Promise<TResponse>;
  /** Delete an item */
  delete<TResponse = MutationResponse>(options: { id: string | number }): Promise<TResponse>;
}

// ==========================================
// ID Types
// ==========================================

/**
 * Valid ID types for RestStd operations.
 */
export type ResourceId = string | number;

/**
 * Array of valid ID types for bulk operations.
 */
export type ResourceIds = ResourceId[];

// ==========================================
// HTTP Method Types
// ==========================================

/**
 * Supported HTTP methods.
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

/**
 * HTTP methods that typically include a request body.
 */
export type HttpMethodWithBody = 'POST' | 'PUT' | 'PATCH';

/**
 * HTTP methods that typically don't include a request body.
 */
export type HttpMethodWithoutBody = 'GET' | 'DELETE' | 'HEAD' | 'OPTIONS';

// ==========================================
// Query Parameter Types
// ==========================================

/**
 * Common query parameters for list endpoints.
 */
export interface CommonQueryParams {
  /** Page number for pagination */
  page?: number;
  /** Number of items per page */
  perPage?: number;
  /** Alias for perPage */
  limit?: number;
  /** Number of items to skip */
  offset?: number;
  /** Field to sort by */
  sortBy?: string;
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
  /** Search query */
  search?: string;
  /** Filter parameters */
  filter?: Record<string, unknown>;
}

/**
 * Type helper for extending common query params.
 * @template T Additional query parameters
 */
export type QueryParams<T extends Record<string, unknown> = Record<string, unknown>> =
  CommonQueryParams & T;

// ==========================================
// Data Transform Types
// ==========================================

/**
 * Options for transforming request/response data.
 */
export interface TransformOptions {
  /** Transform request data before sending */
  transformRequest?: (data: unknown) => unknown;
  /** Transform response data after receiving */
  transformResponse?: (data: unknown) => unknown;
}

/**
 * Type for data that includes an optional ID (used in upsert operations).
 * @template T The base data type
 */
export type DataWithOptionalId<T> = T & { id?: ResourceId };

/**
 * Type for data that requires an ID.
 * @template T The base data type
 */
export type DataWithId<T> = T & { id: ResourceId };

// ==========================================
// Utility Types for Models
// ==========================================

/**
 * Extract the type parameter from a Promise.
 */
export type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

/**
 * Make all properties of T optional and nullable.
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P] | null;
};

/**
 * Pick only the properties of T that are assignable to U.
 */
export type PickByType<T, U> = {
  [P in keyof T as T[P] extends U ? P : never]: T[P];
};

/**
 * Omit properties of T that are assignable to U.
 */
export type OmitByType<T, U> = {
  [P in keyof T as T[P] extends U ? never : P]: T[P];
};

/**
 * Make specific properties required.
 * @template T The base type
 * @template K The keys to make required
 */
export type RequiredProps<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * Make specific properties optional.
 * @template T The base type
 * @template K The keys to make optional
 */
export type OptionalProps<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
