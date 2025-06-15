import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  encrypt,
  decrypt,
  ab2hex,
  hex2ab,
} from "@utils/encryption";

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

    it("should handle invalid hex string for hex2ab", () => {
      expect(hex2ab("invalidhex")).toEqual(new Uint8Array());
    });

    it("should handle mixed case hex string for hex2ab", () => {
      const hex = "0aB2fF";
      const expectedBuffer = new Uint8Array([0x0a, 0xb2, 0xff]);
      expect(hex2ab(hex)).toEqual(expectedBuffer);
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

    it("should fail to decrypt with corrupted data (invalid IV length)", async () => {
      const encrypted = await encrypt(testValue, secretKey);
      const corruptedEncryptedValue =
        encrypted.substring(0, 10) + encrypted.substring(12);

      await expect(
        decrypt(corruptedEncryptedValue, secretKey)
      ).rejects.toThrow();
    });

    it("should fail to decrypt with corrupted data (invalid ciphertext)", async () => {
      const encrypted = await encrypt(testValue, secretKey);
      const corruptedEncryptedValue = encrypted.substring(0, 32) + "abcd";

      await expect(
        decrypt(corruptedEncryptedValue, secretKey)
      ).rejects.toThrow();
    });
  });
  
});
