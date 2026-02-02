import { ComputedRef, Ref } from 'vue';
import { AuthResponse, AuthTokenPaths, LocationPreference, Fetcher } from './index';

// ==========================================
// useFilter Types
// ==========================================

/**
 * Supported data types for filtering operations.
 */
export type FilterType = 'date' | 'string' | 'number' | 'boolean';

/**
 * Criteria for date range filtering.
 */
export interface DateFilterCriteria {
  /** Start date in ISO format or parseable date string */
  startDate: string;
  /** End date in ISO format or parseable date string */
  endDate: string;
}

/**
 * Criteria for number range filtering.
 */
export interface NumberFilterCriteria {
  /** Minimum value (inclusive) */
  min: number;
  /** Maximum value (inclusive) */
  max: number;
}

/**
 * Configuration object for the useFilter composable.
 * @template T The type of filter criteria based on FilterType
 */
export interface FilterConfig<T extends FilterType = FilterType> {
  /** The name of the field in the objects to filter by */
  field: string;
  /** The data type of the field to be filtered */
  type: T;
  /** The criteria for filtering, varies based on type */
  criteria: T extends 'date' ? DateFilterCriteria :
            T extends 'number' ? NumberFilterCriteria :
            T extends 'boolean' ? boolean :
            T extends 'string' ? string :
            unknown;
}

// ==========================================
// useSorter Types
// ==========================================

/**
 * Supported data types for sorting operations.
 */
export type SortType = 'number' | 'date' | 'boolean' | 'string';

/**
 * Sort order direction.
 */
export type SortOrder = 'asc' | 'desc';

/**
 * A single sorting criterion configuration.
 */
export interface SortCriteria {
  /** Unique identifier for this sorting option */
  value: number;
  /** Display label for this sorting option */
  label: string;
  /** The field name to sort by */
  field: string;
  /** Sort order: 'asc' for ascending, 'desc' for descending */
  order: SortOrder;
  /** The data type of the field being sorted */
  type: SortType;
}

/**
 * Return type of the useSorter composable.
 * @template T The type of items being sorted
 */
export type UseSorterReturn<T> = ComputedRef<T[]>;

// ==========================================
// usePagination Types
// ==========================================

/**
 * Return type of the usePagination composable.
 */
export interface UsePaginationReturn {
  /** Computed total number of pages */
  totalPages: ComputedRef<number>;
  /** Function to check if next page exists */
  canFetchNextPage: () => boolean;
  /** Function to check if previous page exists */
  canFetchPreviousPage: () => boolean;
}

/**
 * Options for the usePagination composable.
 */
export interface UsePaginationOptions {
  /** Current page number (1-indexed) */
  page: Ref<number>;
  /** Total number of items */
  total: Ref<number>;
  /** Number of items per page */
  pageSize: Ref<number>;
}

// ==========================================
// useAuth Types
// ==========================================

/**
 * Parameters for the login function.
 */
export type LoginParams = Record<string, unknown>;

/**
 * Parameters for the logout function.
 */
export type LogoutParams = Record<string, unknown>;

/**
 * Return type of the useAuth composable.
 */
export interface UseAuthReturn {
  /**
   * Logs out the user by making a POST request to the logout endpoint,
   * cleaning all stored credentials, and reloading the page.
   * @param params - Optional parameters to send with the logout request
   */
  logout: (params?: LogoutParams) => Promise<void>;

  /**
   * Authenticates the user by making a POST request to the login endpoint,
   * stores the received tokens, and sets the session persistence preference.
   * @param params - The authentication parameters (e.g., username, password)
   * @param persistence - The storage preference for tokens
   * @param tokenPaths - Optional configuration for token paths in API response
   */
  login: (
    params: LoginParams,
    persistence: LocationPreference,
    tokenPaths?: AuthTokenPaths
  ) => Promise<AuthResponse>;
}

/**
 * Options for creating a useAuth instance.
 */
export interface UseAuthOptions {
  /** Optional custom fetcher function */
  fetcher?: Fetcher;
}

// ==========================================
// useBreakpoint Types
// ==========================================

/**
 * Standard breakpoint names.
 */
export type BreakpointName = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/**
 * Breakpoint configuration map.
 */
export type BreakpointConfig = Record<BreakpointName, number>;

// ==========================================
// useApiActivity & useUserActivity Types
// ==========================================

/**
 * Return type of the useApiActivity composable.
 */
export interface UseApiActivityReturn {
  /** Whether an API request is currently in progress */
  isLoading: Ref<boolean>;
  /** Start tracking an API request */
  startRequest: () => void;
  /** End tracking an API request */
  endRequest: () => void;
}

/**
 * Return type of the useUserActivity composable.
 */
export interface UseUserActivityReturn {
  /** Whether the user is currently active */
  isActive: Ref<boolean>;
  /** Last activity timestamp */
  lastActivity: Ref<number>;
  /** Reset the activity timer */
  resetActivity: () => void;
}

/**
 * Options for the useUserActivity composable.
 */
export interface UseUserActivityOptions {
  /** Timeout in milliseconds before user is considered inactive */
  timeout?: number;
  /** Events to track for activity */
  events?: string[];
}
