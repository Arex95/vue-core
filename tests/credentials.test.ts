import { vi, describe, it, expect, beforeEach } from "vitest";
import {
  cleanCredentials,
  getAuthToken,
  getAuthRefreshToken,
  storeAuthToken,
  storeAuthRefreshToken,
} from "@utils/credentials";
import { SessionPreference } from "@config/global/sessionConfig";

vi.mock("@utils/storage", () => ({
  getDecryptedItem: vi.fn(),
  storeEncryptedItem: vi.fn(),
}));

const commonSecretKey = "super-secret-key-for-test";

describe("Credentials Utility Functions", () => {
  let actualTokensConfig: { ACCESS_TOKEN: string; REFRESH_TOKEN: string };

  beforeEach(async () => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();

    const { getTokenConfig } = await import("@config/global/tokensConfig");
    actualTokensConfig = getTokenConfig();
  });

  it("cleanCredentials should remove access and refresh tokens from specified storage ('local')", async () => {
    localStorage.setItem(
      actualTokensConfig.ACCESS_TOKEN,
      "encrypted_access_ls"
    );
    localStorage.setItem(
      actualTokensConfig.REFRESH_TOKEN,
      "encrypted_refresh_ls"
    );
    sessionStorage.setItem(
      actualTokensConfig.ACCESS_TOKEN,
      "encrypted_access_ss"
    );
    sessionStorage.setItem(
      actualTokensConfig.REFRESH_TOKEN,
      "encrypted_refresh_ss"
    );

    await cleanCredentials("local");

    expect(localStorage.getItem(actualTokensConfig.ACCESS_TOKEN)).toBeNull();
    expect(localStorage.getItem(actualTokensConfig.REFRESH_TOKEN)).toBeNull();
    expect(
      sessionStorage.getItem(actualTokensConfig.ACCESS_TOKEN)
    ).not.toBeNull();
    expect(
      sessionStorage.getItem(actualTokensConfig.REFRESH_TOKEN)
    ).not.toBeNull();
  });

  it("cleanCredentials should remove access and refresh tokens from specified storage ('session')", async () => {
    localStorage.setItem(
      actualTokensConfig.ACCESS_TOKEN,
      "encrypted_access_ls"
    );
    localStorage.setItem(
      actualTokensConfig.REFRESH_TOKEN,
      "encrypted_refresh_ls"
    );
    sessionStorage.setItem(
      actualTokensConfig.ACCESS_TOKEN,
      "encrypted_access_ss"
    );
    sessionStorage.setItem(
      actualTokensConfig.REFRESH_TOKEN,
      "encrypted_refresh_ss"
    );

    await cleanCredentials("session");

    expect(
      localStorage.getItem(actualTokensConfig.ACCESS_TOKEN)
    ).not.toBeNull();
    expect(
      localStorage.getItem(actualTokensConfig.REFRESH_TOKEN)
    ).not.toBeNull();
    expect(sessionStorage.getItem(actualTokensConfig.ACCESS_TOKEN)).toBeNull();
    expect(sessionStorage.getItem(actualTokensConfig.REFRESH_TOKEN)).toBeNull();
  });

  it("getAuthToken should retrieve access token from localStorage when preference is 'local'", async () => {
    vi.mocked(
      await import("@utils/storage")
    ).getDecryptedItem.mockResolvedValueOnce("decrypted_access_token_local");

    const token = await getAuthToken(commonSecretKey, "local");

    expect(token).toBe("decrypted_access_token_local");
    expect(
      vi.mocked(await import("@utils/storage")).getDecryptedItem
    ).toHaveBeenCalledWith(
      actualTokensConfig.ACCESS_TOKEN,
      commonSecretKey,
      false
    );
  });

  it("getAuthToken should retrieve access token from sessionStorage when preference is 'session'", async () => {
    vi.mocked(
      await import("@utils/storage")
    ).getDecryptedItem.mockResolvedValueOnce("decrypted_access_token_session");

    const token = await getAuthToken(commonSecretKey, "session");

    expect(token).toBe("decrypted_access_token_session");
    expect(
      vi.mocked(await import("@utils/storage")).getDecryptedItem
    ).toHaveBeenCalledWith(
      actualTokensConfig.ACCESS_TOKEN,
      commonSecretKey,
      true
    );
  });

  it("getAuthToken should return null if no token is found", async () => {
    vi.mocked(
      await import("@utils/storage")
    ).getDecryptedItem.mockResolvedValueOnce(null);

    const token = await getAuthToken(commonSecretKey, "local");

    expect(token).toBeNull();
  });

  it("getAuthRefreshToken should retrieve refresh token from localStorage when preference is 'local'", async () => {
    vi.mocked(
      await import("@utils/storage")
    ).getDecryptedItem.mockResolvedValueOnce("decrypted_refresh_token_local");

    const token = await getAuthRefreshToken(commonSecretKey, "local");

    expect(token).toBe("decrypted_refresh_token_local");
    expect(
      vi.mocked(await import("@utils/storage")).getDecryptedItem
    ).toHaveBeenCalledWith(
      actualTokensConfig.REFRESH_TOKEN,
      commonSecretKey,
      false
    );
  });

  it("getAuthRefreshToken should retrieve refresh token from sessionStorage when preference is 'session'", async () => {
    vi.mocked(
      await import("@utils/storage")
    ).getDecryptedItem.mockResolvedValueOnce("decrypted_refresh_token_session");

    const token = await getAuthRefreshToken(commonSecretKey, "session");

    expect(token).toBe("decrypted_refresh_token_session");
    expect(
      vi.mocked(await import("@utils/storage")).getDecryptedItem
    ).toHaveBeenCalledWith(
      actualTokensConfig.REFRESH_TOKEN,
      commonSecretKey,
      true
    );
  });

  it("getAuthRefreshToken should return null if no token is found", async () => {
    vi.mocked(
      await import("@utils/storage")
    ).getDecryptedItem.mockResolvedValueOnce(null);

    const token = await getAuthRefreshToken(commonSecretKey, "session");

    expect(token).toBeNull();
  });

  it("storeAuthToken should store access token in localStorage when preference is 'local'", async () => {
    const mockToken = "new_access_token";
    const storeEncryptedItemSpy = vi.spyOn(
      await import("@utils/storage"),
      "storeEncryptedItem"
    );

    await storeAuthToken(mockToken, commonSecretKey, "local");

    expect(storeEncryptedItemSpy).toHaveBeenCalledWith(
      actualTokensConfig.ACCESS_TOKEN,
      mockToken,
      commonSecretKey,
      false
    );
  });

  it("storeAuthToken should store access token in sessionStorage when preference is 'session'", async () => {
    const mockToken = "new_session_access_token";
    const storeEncryptedItemSpy = vi.spyOn(
      await import("@utils/storage"),
      "storeEncryptedItem"
    );

    await storeAuthToken(mockToken, commonSecretKey, "session");

    expect(storeEncryptedItemSpy).toHaveBeenCalledWith(
      actualTokensConfig.ACCESS_TOKEN,
      mockToken,
      commonSecretKey,
      true
    );
  });

  it("storeAuthRefreshToken should store refresh token in localStorage when preference is 'local'", async () => {
    const mockToken = "new_refresh_token";
    const storeEncryptedItemSpy = vi.spyOn(
      await import("@utils/storage"),
      "storeEncryptedItem"
    );

    await storeAuthRefreshToken(mockToken, commonSecretKey, "local");

    expect(storeEncryptedItemSpy).toHaveBeenCalledWith(
      actualTokensConfig.REFRESH_TOKEN,
      mockToken,
      commonSecretKey,
      false
    );
  });

  it("storeAuthRefreshToken should store refresh token in sessionStorage when preference is 'session'", async () => {
    const mockToken = "new_session_refresh_token";
    const storeEncryptedItemSpy = vi.spyOn(
      await import("@utils/storage"),
      "storeEncryptedItem"
    );

    await storeAuthRefreshToken(mockToken, commonSecretKey, "session");

    expect(storeEncryptedItemSpy).toHaveBeenCalledWith(
      actualTokensConfig.REFRESH_TOKEN,
      mockToken,
      commonSecretKey,
      true
    );
  });
});
