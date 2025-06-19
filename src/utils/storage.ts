import { encrypt, decrypt } from "./encryption";
import { LocationPreference } from "@/types";

/**
 * Encrypts and stores an item in local or session storage.
 * Assumes the `window` environment is available.
 * @param key The key under which to store the value.
 * @param value The value to encrypt and store.
 * @param secretKey The secret key for encryption.
 * @param location Determines where the item is stored: 'local' for localStorage, 'session' for sessionStorage.
 * @returns A promise that resolves when the item is stored. Throws an error if it fails.
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
 * Retrieves and decrypts a value from local or session storage.
 * Assumes the `window` environment is available.
 * @param key The key of the item to retrieve.
 * @param secretKey The secret key for decryption.
 * @param location Specifies where to search for the item: 'local' for localStorage, 'session' for sessionStorage, or 'any' to check both (session first).
 * @returns A promise that resolves with the decrypted value or null if not found or decryption fails.
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
