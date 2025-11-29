/**
 * An enum that defines a standardized set of keys for accessing `localStorage` and `sessionStorage`.
 * This helps to avoid magic strings and ensures consistency when managing data persistence in the browser.
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
 * A frozen object that serves as an enum for storage types, distinguishing between `sessionStorage` and `localStorage`.
 * Using this object provides a type-safe way to specify the desired storage mechanism.
 * @readonly
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