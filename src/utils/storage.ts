import { encrypt, decrypt } from "./encryption";
import { LocationPreference } from "@/types";
import { getStorage, getSessionStorage, getCookieStorage, isServer, CookieOptions } from "./ssr";

/**
 * Encrypts and stores a key-value pair in either `localStorage`, `sessionStorage`, or cookies.
 * Cookies are automatically used in SSR environments and can be explicitly requested.
 * Cookies include security options: Secure (HTTPS only), SameSite (CSRF protection), and encryption.
 *
 * @param {string} key - The key for the storage item.
 * @param {string} value - The string value to encrypt and store.
 * @param {string} secretKey - The secret key to use for encryption.
 * @param {LocationPreference} location - The storage location: 'local' for `localStorage`, 'session' for `sessionStorage`, 'cookie' for cookies, or 'any' for retrieval.
 * @param {CookieOptions} [cookieOptions] - Optional cookie-specific options (only used when location is 'cookie').
 * @returns {Promise<void>} A promise that resolves when the item has been stored.
 */
export async function storeEncryptedItem(
  key: string,
  value: string,
  secretKey: string,
  location: LocationPreference,
  cookieOptions?: CookieOptions
): Promise<void> {
  const encryptedValue = await encrypt(value, secretKey);
  
  if (location === "cookie" || isServer) {
    const cookieStorage = getCookieStorage();
    const defaultCookieOptions: CookieOptions = {
      expires: location === 'local' || isServer ? 365 : undefined,
      path: '/',
      secure: undefined,
      sameSite: 'Lax',
      ...cookieOptions,
    };
    cookieStorage.setItem(key, encryptedValue, defaultCookieOptions);
    return;
  }

  const storage = location === "local" ? getStorage() : getSessionStorage();
  if (storage) {
    storage.setItem(key, encryptedValue);
  }
}

/**
 * Retrieves and decrypts an item from `localStorage`, `sessionStorage`, or cookies.
 * When location is 'any', checks in order: sessionStorage, localStorage, cookies.
 * Cookies are automatically checked in SSR environments.
 *
 * @param {string} key - The key of the item to retrieve.
 * @param {string} secretKey - The secret key to use for decryption.
 * @param {LocationPreference} location - The storage location to search: 'local', 'session', 'cookie', or 'any' (checks session, local, cookie in that order).
 * @returns {Promise<string | null>} A promise that resolves with the decrypted value, or `null` if the item is not found or decryption fails.
 */
export async function getDecryptedItem(
  key: string,
  secretKey: string,
  location: LocationPreference
): Promise<string | null> {
  let encryptedData: string | null = null;

  if (location === "cookie" || isServer) {
    const cookieStorage = getCookieStorage();
    encryptedData = cookieStorage.getItem(key);
    if (encryptedData) {
      try {
        return await decrypt(encryptedData, secretKey);
      } catch (error) {
        return null;
      }
    }
    if (location === "cookie") {
      return null;
    }
  }

  if (location === "session" || location === "any") {
    const sessionStorage = getSessionStorage();
    encryptedData = sessionStorage?.getItem(key) || null;
    if (encryptedData) {
      try {
        return await decrypt(encryptedData, secretKey);
      } catch (error) {
        return null;
      }
    }
  }

  if (location === "local" || location === "any") {
    const storage = getStorage();
    encryptedData = storage?.getItem(key) || null;
    if (encryptedData) {
      try {
        return await decrypt(encryptedData, secretKey);
      } catch (error) {
        return null;
      }
    }
  }

  return null;
}
