/**
 * Key used for storing the authentication token.
 * @constant {string}
 */
export const TOKEN_KEY = 'TOKEN__';

/**
 * Key used for storing the locale information.
 * @constant {string}
 */
export const LOCALE_KEY = 'LOCALE__';

/**
 * Key used for storing user information.
 * @constant {string}
 */
export const USER_INFO_KEY = 'USER__INFO__';

/**
 * Key used for storing role information.
 * @constant {string}
 */
export const ROLES_KEY = 'ROLES__KEY__';

/**
 * Key used for storing project configuration.
 * @constant {string}
 */
export const PROJ_CFG_KEY = 'PROJ__CFG__KEY__';

/**
 * Key used for storing lock information.
 * @constant {string}
 */
export const LOCK_INFO_KEY = 'LOCK__INFO__KEY__';

/**
 * Key used for base global local cache.
 * @constant {string}
 */
export const APP_LOCAL_CACHE_KEY = 'COMMON__LOCAL__KEY';

/**
 * Key used for base global session cache.
 * @constant {string}
 */
export const APP_SESSION_CACHE_KEY = 'COMMON__SESSION__KEY';

/**
 * Object defining types of cache storage.
 * @readonly
 */
export const CacheTypeEnum = {
  /** Represents session storage */
  SESSION: 0,
  /** Represents local storage */
  LOCAL: 1,
} as const;