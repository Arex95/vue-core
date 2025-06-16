import { vi, describe, it, expect, beforeEach } from "vitest";
import { handleError } from "@utils/errors";
import { jwtDecode } from "jwt-decode";

vi.mock("@utils/storage", () => ({
  getDecryptedItem: vi.fn(),
  storeEncryptedItem: vi.fn(),
}));

vi.mock("jwt-decode", () => ({
  jwtDecode: vi.fn(),
}));

vi.mock("@utils/errors", () => ({
  handleError: vi.fn(),
}));

vi.mock("@config/global/tokensConfig", () => ({
  getTokenConfig: () => ({
    ACCESS_TOKEN: "test_access_token",
    REFRESH_TOKEN: "test_refresh_token",
  }),
}));

const commonSecretKey = "super-secret-key-for-test";

describe("Credentials Utility Functions", () => {
  let credentials: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    credentials = await import("@utils/credentials");
  });

  describe("cleanCredentials", () => {
    it("should remove tokens from storage", async () => {
      const localStorageMock = { removeItem: vi.fn() };
      const sessionStorageMock = { removeItem: vi.fn() };

      global.localStorage = localStorageMock as any;
      global.sessionStorage = sessionStorageMock as any;

      await credentials.cleanCredentials("local");
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        "test_access_token"
      );
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        "test_refresh_token"
      );

      await credentials.cleanCredentials("session");
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(
        "test_access_token"
      );
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(
        "test_refresh_token"
      );
    });
  });

  describe("getAuthToken", () => {
    it("should retrieve token from storage", async () => {
      const { getDecryptedItem } = await import("@utils/storage");
      vi.mocked(getDecryptedItem).mockResolvedValue("decrypted_token");

      const token = await credentials.getAuthToken(commonSecretKey, "local");
      expect(token).toBe("decrypted_token");
    });
  });

  describe("storeAuthToken", () => {
    it("should store token in storage", async () => {
      const { storeEncryptedItem } = await import("@utils/storage");

      await credentials.storeAuthToken("new_token", commonSecretKey, "local");
      expect(storeEncryptedItem).toHaveBeenCalled();
    });
  });

  describe("verifyAuth", () => {
    const MOCK_DATE = 1678886400000;
    const FUTURE_EXP = MOCK_DATE / 1000 + 3600;
    const PAST_EXP = MOCK_DATE / 1000 - 3600;

    beforeEach(() => {
      vi.spyOn(Date, "now").mockReturnValue(MOCK_DATE);
    });

    it("should return true for valid token", async () => {
      const { getDecryptedItem } = await import("@utils/storage");
      vi.mocked(getDecryptedItem).mockResolvedValue("valid_token");
      vi.mocked(jwtDecode).mockReturnValue({ exp: FUTURE_EXP });

      const result = await credentials.verifyAuth(commonSecretKey, "session");
      expect(result).toBe(true);
    });

    it("should handle missing token", async () => {
      const { getDecryptedItem } = await import("@utils/storage");
      vi.mocked(getDecryptedItem).mockResolvedValue(null);

      const sessionStorageMock = { removeItem: vi.fn() };
      global.sessionStorage = sessionStorageMock as any;

      const result = await credentials.verifyAuth(commonSecretKey, "session");

      expect(result).toBe(false);
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(
        "test_access_token"
      );
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(
        "test_refresh_token"
      );
      expect(handleError).toHaveBeenCalledWith(
        "TOKEN_MISSING: No valid token found",
        false
      );
    });

    it("should handle expired token", async () => {
      const { getDecryptedItem } = await import("@utils/storage");
      vi.mocked(getDecryptedItem).mockResolvedValue("expired_token");
      vi.mocked(jwtDecode).mockReturnValue({ exp: PAST_EXP });

      const sessionStorageMock = { removeItem: vi.fn() };
      global.sessionStorage = sessionStorageMock as any;

      const result = await credentials.verifyAuth(commonSecretKey, "session");

      expect(result).toBe(false);
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(
        "test_access_token"
      );
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(
        "test_refresh_token"
      );
      expect(handleError).toHaveBeenCalledWith(
        "TOKEN_EXPIRED: Token is expired",
        false
      );
    });

    it("should handle invalid token", async () => {
      const { getDecryptedItem } = await import("@utils/storage");
      vi.mocked(getDecryptedItem).mockResolvedValue("invalid_token");
      vi.mocked(jwtDecode).mockImplementation(() => {
        throw new Error("Invalid token");
      });

      const sessionStorageMock = { removeItem: vi.fn() };
      global.sessionStorage = sessionStorageMock as any;

      const result = await credentials.verifyAuth(commonSecretKey, "session");

      expect(result).toBe(false);
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(
        "test_access_token"
      );
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(
        "test_refresh_token"
      );
      expect(handleError).toHaveBeenCalledWith(
        "TOKEN_INVALID: Invalid token format",
        false
      );
    });
  });
});
