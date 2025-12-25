import { StorageDriver } from "@/types/Storage";
import { BrowserCookieDriver } from "./BrowserCookieDriver";
import { LocalStorageDriver } from "./LocalStorageDriver";
import { SessionStorageDriver } from "./SessionStorageDriver";

export { BrowserCookieDriver, LocalStorageDriver, SessionStorageDriver };

/**
 * Gets the default storage driver based on the environment.
 * In SSR, defaults to BrowserCookieDriver.
 * In client, defaults to LocalStorageDriver.
 */
export function getDefaultStorageDriver(): StorageDriver {
  if (typeof window === 'undefined') {
    return BrowserCookieDriver;
  }
  return LocalStorageDriver;
}

