import { encrypt, decrypt } from "./encryption";
import { LocationPreference } from "@/types";

/**
 * Encrypts and stores a key-value pair in either `localStorage` or `sessionStorage`.
 *
 * @param {string} key - The key for the storage item.
 * @param {string} value - The string value to encrypt and store.
 * @param {string} secretKey - The secret key to use for encryption.
 * @param {LocationPreference} location - The storage location: 'local' for `localStorage` or 'session' for `sessionStorage`.
 * @returns {Promise<void>} A promise that resolves when the item has been stored.
 * @throws {Error} If the `window` object is not available.
 */
export async function storeEncryptedItem(
  key: string,
  value: string,
  secretKey: string,
  location: LocationPreference
): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("Cannot access storage: window is not defined.");
  }

  const storage =
    location === "local" ? window.localStorage : window.sessionStorage;
  const encryptedValue = await encrypt(value, secretKey);
  storage.setItem(key, encryptedValue);
}

/**
 * Retrieves and decrypts an item from `localStorage` or `sessionStorage`.
 *
 * @param {string} key - The key of the item to retrieve.
 * @param {string} secretKey - The secret key to use for decryption.
 * @param {LocationPreference} location - The storage location to search: 'local', 'session', or 'any' (checks session first, then local).
 * @returns {Promise<string | null>} A promise that resolves with the decrypted value, or `null` if the item is not found or decryption fails.
 */
export async function getDecryptedItem(
  key: string,
  secretKey: string,
  location: LocationPreference
): Promise<string | null> {
  if (typeof window === "undefined") {
    return null;
  }

  let encryptedData: string | null = null;

  if (location === "session" || location === "any") {
    encryptedData = window.sessionStorage.getItem(key);
  }

  if (!encryptedData && (location === "local" || location === "any")) {
    encryptedData = window.localStorage.getItem(key);
  }

  if (!encryptedData) {
    return null;
  }

  try {
    return await decrypt(encryptedData, secretKey);
  } catch (error) {
    return null;
  }
}
