import { encrypt, decrypt } from "./encryption";

/**
 * Encrypts and stores an item in local or session storage.
 * Assumes the `window` environment is available.
 * @param key The key under which to store the value.
 * @param value The value to encrypt and store.
 * @param secretKey The secret key for encryption.
 * @param isRememberMe If true, uses localStorage; otherwise, uses sessionStorage.
 * @returns A promise that resolves when the item is stored. Throws an error if it fails.
 */
export async function storeEncryptedItem(
  key: string,
  value: string,
  secretKey: string,
  isRememberMe: boolean
): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("Cannot access storage: window is not defined.");
  }

  const storage = isRememberMe ? window.localStorage : window.sessionStorage;
  const encryptedValue = await encrypt(value, secretKey);
  storage.setItem(key, encryptedValue);
}

/**
 * Retrieves and decrypts a value from local or session storage.
 * Assumes the `window` environment is available.
 * @param key The key of the item to retrieve.
 * @param secretKey The secret key for decryption.
 * @param isRememberMe If true, searches localStorage; otherwise, sessionStorage.
 * @returns A promise that resolves with the decrypted value or null if not found or decryption fails.
 */
export async function getDecryptedItem(
  key: string,
  secretKey: string,
  isRememberMe: boolean
): Promise<string | null> {
  if (typeof window === "undefined") {
    return null;
  }

  const storage = isRememberMe ? window.localStorage : window.sessionStorage;
  const encryptedData = storage.getItem(key);

  if (!encryptedData) {
    return null;
  }

  try {
    return await decrypt(encryptedData, secretKey);
  } catch (error) {
    return null;
  }
}
