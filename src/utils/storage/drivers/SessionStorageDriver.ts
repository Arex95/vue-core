import { StorageDriver, StorageContext, StorageOptions } from "@/types/Storage";

/**
 * SessionStorage Driver - handles sessionStorage operations.
 * Only works in client-side context. Returns null in SSR.
 */
export const SessionStorageDriver: StorageDriver = {
  get: (key: string, context?: StorageContext): string | null => {
    if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
      return null;
    }
    try {
      return sessionStorage.getItem(key);
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
    if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
      return;
    }
    try {
      sessionStorage.setItem(key, value);
    } catch (error) {
      console.warn(`Failed to set sessionStorage item "${key}":`, error);
    }
  },

  remove: (
    key: string,
    options?: StorageOptions,
    context?: StorageContext
  ): void => {
    if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
      return;
    }
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.warn(`Failed to remove sessionStorage item "${key}":`, error);
    }
  },
};

