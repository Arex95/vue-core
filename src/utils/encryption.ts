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
 */
export function hex2ab(hex: string): Uint8Array {
  if (!hex || !/^[0-9a-fA-F]*$/.test(hex)) {
    return new Uint8Array();
  }
  const matches = hex.match(/[0-9a-fA-F]{1,2}/g);
  return new Uint8Array(
    matches ? matches.map((byte) => parseInt(byte, 16)) : []
  );
}

/**
 * Derives an encryption key from a secret key.
 * @param secretKey The secret key in plain text.
 * @returns A promise that resolves with the derived CryptoKey.
 */
export async function importKey(secretKey: string): Promise<CryptoKey> {
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
 */
export async function decrypt(
  encryptedValue: string,
  secretKey: string
): Promise<string> {
  const key = await importKey(secretKey);

  const ivHex = encryptedValue.substring(0, 32);
  const ciphertextHex = encryptedValue.substring(32);

  const iv = hex2ab(ivHex);
  const ciphertext = hex2ab(ciphertextHex);

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: "AES-CBC", iv: iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decryptedBuffer);
}
