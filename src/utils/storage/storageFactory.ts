import { UniversalStorage } from "./UniversalStorage";
import { StorageContext } from "@/types/Storage";
import { getGlobalStorageDriver } from "@/config/global/storageConfig";
import { getAppKey } from "@/config/global/keyConfig";

/**
 * Creates a new UniversalStorage instance for the current request.
 * Uses the global storage driver and app key configuration.
 * 
 * @param contextGetter - Optional function to get SSR context
 * @returns A new UniversalStorage instance
 */
export function createStorageForRequest(
  contextGetter?: () => StorageContext | Promise<StorageContext> | null
): UniversalStorage {
  const driver = getGlobalStorageDriver();
  const appKey = getAppKey();
  return new UniversalStorage(driver, appKey, contextGetter);
}

