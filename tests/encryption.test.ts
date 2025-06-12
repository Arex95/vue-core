import { describe, expect, test } from "vitest";

import { useAuth } from "@composables/auth/useAuth";

describe("Encryption Utilities", () => {
  const testSecretKey = "super-secret-key-for-testing-123";
  const testValue = "This is a test string to be encrypted and decrypted.";
  const emptyValue = "";

  describe("ab2hex and hex2ab", () => {
    test("should convert ArrayBuffer to hex and back correctly", () => {
      const originalArray = new Uint8Array([0x00, 0x01, 0x0a, 0xff]);
      const hexString = useAuth().ab2hex(originalArray);
      const convertedArray = useAuth().hex2ab(hexString);

      expect(hexString).toBe("00010aff");
      expect(convertedArray).toEqual(originalArray);
    });

    test("should handle empty ArrayBuffer", () => {
      const originalArray = new Uint8Array([]);
      const hexString = useAuth().ab2hex(originalArray);
      const convertedArray = useAuth().hex2ab(hexString);

      expect(hexString).toBe("");
      expect(convertedArray).toEqual(originalArray);
    });
  });

  describe("importKey", () => {
    test("should import a CryptoKey successfully", async () => {
      const key = await useAuth().importKey(testSecretKey);
      expect(key).toBeInstanceOf(CryptoKey);
      expect(key.algorithm.name).toBe("AES-CBC");
      expect(key.extractable).toBe(false);
      expect(key.usages).toEqual(
        expect.arrayContaining(["encrypt", "decrypt"])
      );
    });
  });

  describe("encrypt and decrypt", () => {
    test("should encrypt a value and decrypt it back to the original", async () => {
      const encrypted = await useAuth().encrypt(testValue, testSecretKey);
      expect(encrypted).toBeTypeOf("string");
      expect(encrypted.length).toBeGreaterThan(32);

      const decrypted = await useAuth().decrypt(encrypted, testSecretKey);
      expect(decrypted).toBe(testValue);
    });

    test("should handle empty string encryption and decryption", async () => {
      const encrypted = await useAuth().encrypt(emptyValue, testSecretKey);
      expect(encrypted).toBeTypeOf("string");
      expect(encrypted.length).toBeGreaterThanOrEqual(32);

      const decrypted = await useAuth().decrypt(encrypted, testSecretKey);
      expect(decrypted).toBe(emptyValue);
    });

    test("should fail to decrypt with an incorrect secret key", async () => {
      const encrypted = await useAuth().encrypt(testValue, testSecretKey);
      const wrongSecretKey = "this-is-a-wrong-key-456";

      await expect(
        useAuth().decrypt(encrypted, wrongSecretKey)
      ).rejects.toThrow();
    });

    test("should fail to decrypt malformed or truncated encrypted string", async () => {
      const encrypted = await useAuth().encrypt(testValue, testSecretKey);
      const malformedEncrypted = encrypted.substring(0, 40);

      await expect(
        useAuth().decrypt(malformedEncrypted, testSecretKey)
      ).rejects.toThrow();

      const shortEncrypted = "1234567890abcdef1234567890abcdef";
      await expect(
        useAuth().decrypt(shortEncrypted, testSecretKey)
      ).rejects.toThrow();
    });
  });
});
