import { StorageDriver, StorageContext, StorageOptions } from "@/types/Storage";

/**
 * LocalStorage Driver - handles localStorage operations.
 * Only works in client-side context. Returns null in SSR.
 */
export const LocalStorageDriver: StorageDriver = {
  get: (key: string, context?: StorageContext): string | null => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return null;
    }
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  set: (
    key: string,
    value: string,
    options?: StorageOptions,
    context?: StorageContext
  ): void => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn(`Failed to set localStorage item "${key}":`, error);
    }
  },

  remove: (
    key: string,
    options?: StorageOptions,
    context?: StorageContext
  ): void => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Failed to remove localStorage item "${key}":`, error);
    }
  },
};

