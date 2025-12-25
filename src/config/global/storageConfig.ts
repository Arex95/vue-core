import { StorageDriver, StorageContext, RedirectStrategy } from "@/types/Storage";
import { getDefaultStorageDriver } from "@/utils/storage/drivers";

let globalStorageDriver: StorageDriver | null = null;
let globalSSRContextGetter: (() => StorageContext | Promise<StorageContext> | null) | null = null;
let globalRedirectStrategy: RedirectStrategy | null = null;

/**
 * Default redirect strategy that uses window.location in client.
 * In SSR, does nothing (each framework should provide its own).
 */
const defaultRedirectStrategy: RedirectStrategy = {
  redirect: (path: string) => {
    if (typeof window !== 'undefined') {
      window.location.href = path;
    }
    // En SSR sin framework específico, simplemente no hace nada
    // Cada framework puede proporcionar su propia implementación
  }
};

/**
 * Sets the global storage driver.
 */
export function setGlobalStorageDriver(driver: StorageDriver): void {
  globalStorageDriver = driver;
}

/**
 * Gets the global storage driver, or returns the default based on environment.
 */
export function getGlobalStorageDriver(): StorageDriver {
  return globalStorageDriver || getDefaultStorageDriver();
}

/**
 * Sets the global SSR context getter.
 */
export function setGlobalSSRContextGetter(
  getter: () => StorageContext | Promise<StorageContext> | null
): void {
  globalSSRContextGetter = getter;
}

/**
 * Gets the global SSR context getter.
 */
export function getGlobalSSRContextGetter(): (() => StorageContext | Promise<StorageContext> | null) | null {
  return globalSSRContextGetter;
}

/**
 * Sets the global redirect strategy.
 */
export function setGlobalRedirectStrategy(strategy: RedirectStrategy): void {
  globalRedirectStrategy = strategy;
}

/**
 * Gets the global redirect strategy, or returns the default.
 */
export function getGlobalRedirectStrategy(): RedirectStrategy {
  return globalRedirectStrategy || defaultRedirectStrategy;
}

