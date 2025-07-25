import { describe, it, expect, beforeEach, vi } from "vitest";
import { encrypt, decrypt, ab2hex, hex2ab } from "@utils/encryption";

describe("Encryption Utilities", () => {
  const secretKey = "mySuperSecretKey123";
  const testValue = "Hello, this is a test string for encryption.";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("ab2hex and hex2ab", () => {
    it("should correctly convert ArrayBuffer to hex string", () => {
      const buffer = new Uint8Array([0x01, 0x0a, 0xff, 0x00]);
      expect(ab2hex(buffer)).toBe("010aff00");
    });

    it("should correctly convert hex string to Uint8Array", () => {
      const hex = "010aff00";
      const expectedBuffer = new Uint8Array([0x01, 0x0a, 0xff, 0x00]);
      expect(hex2ab(hex)).toEqual(expectedBuffer);
    });

    it("should handle empty hex string for hex2ab", () => {
      expect(hex2ab("")).toEqual(new Uint8Array());
    });

    it("should handle mixed case hex string for hex2ab", () => {
      const hex = "0aB2fF";
      const expectedBuffer = new Uint8Array([0x0a, 0xb2, 0xff]);
      expect(hex2ab(hex)).toEqual(expectedBuffer);
    });

    it("should throw TypeError for non-string input to hex2ab", () => {
      expect(() => hex2ab(123 as any)).toThrow(TypeError);
      expect(() => hex2ab(null as any)).toThrow(TypeError);
    });

    it("should throw Error for invalid hex string format to hex2ab", () => {
      expect(() => hex2ab("invalidhex")).toThrow(
        "Invalid hexadecimal string format or odd length."
      );
      expect(() => hex2ab("123G")).toThrow(
        "Invalid hexadecimal string format or odd length."
      );
    });

    it("should throw Error for odd length hex string to hex2ab", () => {
      expect(() => hex2ab("123")).toThrow(
        "Invalid hexadecimal string format or odd length."
      );
      expect(() => hex2ab("abcde")).toThrow(
        "Invalid hexadecimal string format or odd length."
      );
    });
  });

  describe("encrypt and decrypt", () => {
    it("should encrypt a string and decrypt it back to the original value", async () => {
      const encrypted = await encrypt(testValue, secretKey);
      expect(encrypted).toBeTypeOf("string");
      expect(encrypted.length).toBeGreaterThan(0);

      const decrypted = await decrypt(encrypted, secretKey);
      expect(decrypted).toBe(testValue);
    });

    it("should fail to decrypt with an incorrect secret key", async () => {
      const encrypted = await encrypt(testValue, secretKey);
      await expect(decrypt(encrypted, "wrongKey")).rejects.toThrow();
    });

    it("should fail to decrypt with an empty encrypted value", async () => {
      await expect(decrypt("", secretKey)).rejects.toThrow(
        "Encrypted value cannot be null or empty."
      );
    });

    it("should fail to decrypt with an encrypted value that's too short", async () => {
      await expect(decrypt("12345", secretKey)).rejects.toThrow(
        "Encrypted value is too short. Expected at least 32 hexadecimal characters for the IV."
      );
    });

    it("should fail to decrypt with corrupted data (invalid IV length after hex2ab)", async () => {
      const encrypted = await encrypt(testValue, secretKey);
      const corruptedEncryptedValue =
        "0000000000000000000000000000000Z" + encrypted.substring(32);
      await expect(decrypt(corruptedEncryptedValue, secretKey)).rejects.toThrow(
        "Invalid hexadecimal string format or odd length."
      );
    });

    it("should fail to decrypt with corrupted data (invalid ciphertext format)", async () => {
      const encrypted = await encrypt(testValue, secretKey);
      const corruptedEncryptedValue = encrypted.substring(0, 32) + "invalidhex";
      await expect(decrypt(corruptedEncryptedValue, secretKey)).rejects.toThrow(
        "Invalid hexadecimal string format or odd length."
      );
    });

    it("should fail to decrypt when ciphertext is empty after conversion", async () => {
      const ivHex = "00000000000000000000000000000000";
      const emptyCiphertextEncryptedValue = ivHex + "";
      await expect(
        decrypt(emptyCiphertextEncryptedValue, secretKey)
      ).rejects.toThrow("Ciphertext is empty. No data to decrypt.");
    });
  });
});
