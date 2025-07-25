/**
 * Converts an ArrayBuffer or Uint8Array to a hexadecimal string.
 * @param buffer The ArrayBuffer or Uint8Array to convert.
 * @returns The hexadecimal string.
 */
export function ab2hex(buffer: ArrayBuffer | Uint8Array): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Converts a hexadecimal string to a Uint8Array.
 * @param hex The hexadecimal string to convert.
 * @returns The Uint8Array.
 * @throws {TypeError} If the input is not a string.
 * @throws {Error} If the hexadecimal string format is invalid or has an odd length.
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
 * Derives an encryption key from a secret key.
 * @param secretKey The secret key in plain text.
 * @returns A promise that resolves with the derived CryptoKey.
 * @throws {Error} If the secretKey is null or empty.
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
 * Encrypts a value with the provided secret key.
 * @param value The value to encrypt.
 * @param secretKey The secret key for encryption.
 * @returns A promise that resolves with the IV (hex) + ciphertext (hex) string.
 * @throws {Error} If the secretKey is null or empty (via importKey).
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
 * Decrypts an encrypted value.
 * @param encryptedValue The encrypted string (IV_hex + ciphertext_hex).
 * @param secretKey The secret key for decryption.
 * @returns A promise that resolves with the decrypted value.
 * @throws {Error} If encryptedValue is null or empty, too short,
 * or if the IV/ciphertext have incorrect lengths after conversion.
 * @throws {Error} If the secretKey is null or empty (via importKey).
 * @throws {TypeError} If hex2ab receives an invalid input type.
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
