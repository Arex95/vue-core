/**
 * Enum for different storage keys used in the application.
 * This enum contains the keys for storing authentication token, locale information, user info, roles, and more.
 * @readonly
 * @enum {string}
 */
export enum StorageKeyEnum {
  /**
   * Key used for storing the authentication token.
   * @constant {string}
   */
  TOKEN_KEY = 'TOKEN__',

  /**
   * Key used for storing the locale information.
   * @constant {string}
   */
  LOCALE_KEY = 'LOCALE__',

  /**
   * Key used for storing user information.
   * @constant {string}
   */
  USER_INFO_KEY = 'USER__INFO__',

  /**
   * Key used for storing role information.
   * @constant {string}
   */
  ROLES_KEY = 'ROLES__KEY__',

  /**
   * Key used for storing project configuration.
   * @constant {string}
   */
  PROJ_CFG_KEY = 'PROJ__CFG__KEY__',

  /**
   * Key used for storing lock information.
   * @constant {string}
   */
  LOCK_INFO_KEY = 'LOCK__INFO__KEY__',

  /**
   * Key used for base global local cache.
   * @constant {string}
   */
  APP_LOCAL_CACHE_KEY = 'COMMON__LOCAL__KEY',

  /**
   * Key used for base global session cache.
   * @constant {string}
   */
  APP_SESSION_CACHE_KEY = 'COMMON__SESSION__KEY',
}

/**
 * Enum defining types of storage.
 * @readonly
 * @enum {number}
 */
export const StorageTypeEnum = {
  /**
   * Represents session storage.
   * @constant {number}
   */
  SESSION: 0,

  /**
   * Represents local storage.
   * @constant {number}
   */
  LOCAL: 1,
} as const;

export type StorageTypeEnum = keyof typeof StorageTypeEnum;