/**
 * Converts an `ArrayBuffer` or `Uint8Array` into a hexadecimal string representation.
 *
 * @param {ArrayBuffer | Uint8Array} buffer - The buffer to convert.
 * @returns {string} The resulting hexadecimal string.
 */
export function ab2hex(buffer: ArrayBuffer | Uint8Array): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Converts a hexadecimal string into a `Uint8Array`.
 *
 * @param {string} hex - The hexadecimal string to convert.
 * @returns {Uint8Array} The resulting `Uint8Array`.
 * @throws {TypeError} If the input is not a string.
 * @throws {Error} If the hexadecimal string has an invalid format or an odd length.
 */
export function hex2ab(hex: string): Uint8Array {
  if (typeof hex !== "string") {
    throw new TypeError("Input must be a string.");
  }
  if (hex.length === 0) {
    return new Uint8Array();
  }
  if (!/^[0-9a-fA-F]*$/.test(hex) || hex.length % 2 !== 0) {
    throw new Error("Invalid hexadecimal string format or odd length.");
  }
  const array = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    array[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return array;
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

  const keyMaterial = new TextEncoder().encode(secretKey);
  const digest = await crypto.subtle.digest("SHA-256", keyMaterial);

  return crypto.subtle.importKey(
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
 *
 * @param {string} value - The plain-text string to encrypt.
 * @param {string} secretKey - The secret key to use for encryption.
 * @returns {Promise<string>} A promise that resolves with a concatenated hexadecimal string of the IV and the ciphertext.
 * @throws {Error} If the `secretKey` is null or empty.
 */
export async function encrypt(
  value: string,
  secretKey: string
): Promise<string> {
  const key = await importKey(secretKey);
  const iv = crypto.getRandomValues(new Uint8Array(16));
  const encodedValue = new TextEncoder().encode(value);

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-CBC", iv: iv },
    key,
    encodedValue
  );

  return ab2hex(iv) + ab2hex(new Uint8Array(ciphertext));
}

/**
 * Decrypts a hexadecimal string (IV + ciphertext) using AES-CBC with a given secret key.
 *
 * @param {string} encryptedValue - The concatenated hexadecimal string of the IV and ciphertext.
 * @param {string} secretKey - The secret key to use for decryption.
 * @returns {Promise<string>} A promise that resolves with the decrypted plain-text string.
 * @throws {Error} If the encrypted value is null, empty, or too short, or if the `secretKey` is invalid.
 */
export async function decrypt(
  encryptedValue: string,
  secretKey: string
): Promise<string> {
  if (!encryptedValue) {
    throw new Error("Encrypted value cannot be null or empty.");
  }

  // For AES-CBC, the IV is ALWAYS 16 bytes.
  // 16 bytes * 2 hex characters/byte = 32 hex characters for the IV.
  if (encryptedValue.length < 32) {
    throw new Error(
      "Encrypted value is too short. Expected at least 32 hexadecimal characters for the IV."
    );
  }

  const key = await importKey(secretKey);

  const ivHex = encryptedValue.substring(0, 32);
  const ciphertextHex = encryptedValue.substring(32);

  const iv = hex2ab(ivHex);
  const ciphertext = hex2ab(ciphertextHex);

  if (iv.byteLength !== 16) {
    throw new Error(
      `Converted IV has incorrect length: ${iv.byteLength} bytes. Expected 16 bytes.`
    );
  }

  if (ciphertext.byteLength === 0) {
    throw new Error("Ciphertext is empty. No data to decrypt.");
  }

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: "AES-CBC", iv: iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decryptedBuffer);
}
