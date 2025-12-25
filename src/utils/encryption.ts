/**
 * Gets the crypto.subtle API, with basic environment detection.
 * Tries Browser → Node.js → throws error.
 */
function getCryptoSubtle(): SubtleCrypto {
  // Browser
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    return window.crypto.subtle;
  }
  
  // Node.js - use global crypto if available (Node.js 15+)
  if (typeof globalThis !== 'undefined' && (globalThis as any).crypto && (globalThis as any).crypto.subtle) {
    return (globalThis as any).crypto.subtle;
  }
  
  throw new Error(
    'Web Crypto API not available. ' +
    'This library requires crypto.subtle support.'
  );
}

/**
 * Converts an `ArrayBuffer` or `Uint8Array` into a Base64url string representation.
 * Base64url is URL-safe and more compact than hexadecimal (~33% smaller).
 *
 * @param {ArrayBuffer | Uint8Array} buffer - The buffer to convert.
 * @returns {string} The resulting Base64url string.
 */
export function ab2base64url(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  // Convert to base64, then make it URL-safe
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Converts a Base64url string into a `Uint8Array`.
 *
 * @param {string} base64url - The Base64url string to convert.
 * @returns {Uint8Array} The resulting `Uint8Array`.
 * @throws {TypeError} If the input is not a string.
 * @throws {Error} If the Base64url string has an invalid format.
 */
export function base64url2ab(base64url: string): Uint8Array {
  if (typeof base64url !== "string") {
    throw new TypeError("Input must be a string.");
  }
  if (base64url.length === 0) {
    return new Uint8Array();
  }
  
  // Restore base64 padding and convert URL-safe characters back
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding if needed
  while (base64.length % 4) {
    base64 += '=';
  }
  
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    throw new Error("Invalid Base64url string format.");
  }
}

/**
 * Derives a `CryptoKey` for AES-CBC encryption from a plain-text secret key.
 * It uses SHA-256 to hash the secret key, ensuring a fixed-length key suitable for the Web Crypto API.
 *
 * @param {string} secretKey - The plain-text secret key.
 * @returns {Promise<CryptoKey>} A promise that resolves with the derived `CryptoKey`.
 * @throws {Error} If the `secretKey` is null or empty.
 */
export async function importKey(secretKey: string): Promise<CryptoKey> {
  if (!secretKey) {
    throw new Error("Secret key cannot be null or empty.");
  }

  const subtle = getCryptoSubtle();
  const keyMaterial = new TextEncoder().encode(secretKey);
  const digest = await subtle.digest("SHA-256", keyMaterial);

  return subtle.importKey(
    "raw",
    digest,
    { name: "AES-CBC", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts a plain-text value using AES-CBC with a given secret key.
 * A random 16-byte initialization vector (IV) is generated for each encryption.
 * Uses Base64url encoding for compact, URL-safe output.
 *
 * @param {string} value - The plain-text string to encrypt.
 * @param {string} secretKey - The secret key to use for encryption.
 * @returns {Promise<string>} A promise that resolves with a Base64url string: "IV.ciphertext" (separated by '.').
 * @throws {Error} If the `secretKey` is null or empty.
 */
export async function encrypt(
  value: string,
  secretKey: string
): Promise<string> {
  const subtle = getCryptoSubtle();
  const key = await importKey(secretKey);
  
  // Get random IV - use the appropriate crypto API
  let iv: Uint8Array;
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    iv = window.crypto.getRandomValues(new Uint8Array(16));
  } else if (typeof globalThis !== 'undefined' && (globalThis as any).crypto && (globalThis as any).crypto.getRandomValues) {
    // Node.js fallback (Node.js 15+)
    iv = (globalThis as any).crypto.getRandomValues(new Uint8Array(16));
  } else {
    throw new Error('getRandomValues not available');
  }
  
  const encodedValue = new TextEncoder().encode(value);

  const ciphertext = await subtle.encrypt(
    { name: "AES-CBC", iv: iv },
    key,
    encodedValue
  );

  // Format: Base64url(IV).Base64url(ciphertext)
  const ivBase64url = ab2base64url(iv);
  const ciphertextBase64url = ab2base64url(ciphertext);
  return `${ivBase64url}.${ciphertextBase64url}`;
}

/**
 * Decrypts a Base64url string (IV.ciphertext format) using AES-CBC with a given secret key.
 *
 * @param {string} encryptedValue - The Base64url string in format "IV.ciphertext" (separated by '.').
 * @param {string} secretKey - The secret key to use for decryption.
 * @returns {Promise<string>} A promise that resolves with the decrypted plain-text string.
 * @throws {Error} If the encrypted value is null, empty, or has invalid format, or if the `secretKey` is invalid.
 */
export async function decrypt(
  encryptedValue: string,
  secretKey: string
): Promise<string> {
  if (!encryptedValue) {
    throw new Error("Encrypted value cannot be null or empty.");
  }

  // Formato simple: Base64url con separador '.'
  const [ivBase64url, ciphertextBase64url] = encryptedValue.split('.');
  
  if (!ivBase64url || !ciphertextBase64url) {
    throw new Error("Invalid encrypted value format. Expected format: 'IV.ciphertext'");
  }

  const subtle = getCryptoSubtle();
  const key = await importKey(secretKey);
  const iv = base64url2ab(ivBase64url);
  const ciphertext = base64url2ab(ciphertextBase64url);

  if (iv.byteLength !== 16) {
    throw new Error(
      `Converted IV has incorrect length: ${iv.byteLength} bytes. Expected 16 bytes.`
    );
  }

  if (ciphertext.byteLength === 0) {
    throw new Error("Ciphertext is empty. No data to decrypt.");
  }

  const decryptedBuffer = await subtle.decrypt(
    { name: "AES-CBC", iv: iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decryptedBuffer);
}
