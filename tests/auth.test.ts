import {
  vi,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  MockInstance,
} from "vitest";
import { SessionPreference } from "@config/global/sessionConfig";

vi.mock("@utils/credentials", () => ({
  cleanCredentials: vi.fn(),
  getAuthToken: vi.fn(),
  getAuthRefreshToken: vi.fn(),
  storeAuthToken: vi.fn(),
  storeAuthRefreshToken: vi.fn(),
}));

vi.mock("@config/global/sessionConfig", () => ({
  configSession: vi.fn(),
  getSessionPersistencePreference: vi.fn(),
}));

vi.mock("jwt-decode", () => ({
  jwtDecode: vi.fn(),
}));

import {
  cleanCredentials,
  getAuthToken,
  getAuthRefreshToken,
  storeAuthToken,
  storeAuthRefreshToken,
} from "@utils/credentials";
import { jwtDecode } from "jwt-decode";
import { getTokenConfig, getSecretKey } from "@config/global/tokensConfig";
import { getEndpointsConfig } from "@config/global/endpointsConfig";
import { handleError } from "@utils/errors";
import { getAxiosInstance } from "@config/axios";
import {
  configSession,
  getSessionPersistencePreference,
} from "@config/global/sessionConfig";

let axiosPostMock: MockInstance;
let windowLocationReloadSpy: MockInstance;
let DateNowSpy: MockInstance;

let localStorageMock: {
  getItem: MockInstance;
  setItem: MockInstance;
  removeItem: MockInstance;
  clear: MockInstance;
};
let sessionStorageMock: {
  getItem: MockInstance;
  setItem: MockInstance;
  removeItem: MockInstance;
  clear: MockInstance;
};

describe("useAuth Hook", () => {
  let auth: ReturnType<typeof import("@composables/auth").useAuth>;
  let realWindowLocation: Location;
  let SECRET_KEY: string;
  let ENDPOINTS: ReturnType<typeof getEndpointsConfig>;

  const MOCK_DATE_NOW = 1678886400000;
  const FUTURE_EXP_SECONDS = MOCK_DATE_NOW / 1000 + 3600;
  const PAST_EXP_SECONDS = MOCK_DATE_NOW / 1000 - 3600;

  beforeEach(async () => {
    let _localStorageStore: { [key: string]: string } = {};
    localStorageMock = {
      getItem: vi.fn((key: string) => _localStorageStore[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        _localStorageStore[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete _localStorageStore[key];
      }),
      clear: vi.fn(() => {
        _localStorageStore = {};
      }),
    };

    let _sessionStorageStore: { [key: string]: string } = {};
    sessionStorageMock = {
      getItem: vi.fn((key: string) => _sessionStorageStore[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        _sessionStorageStore[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete _sessionStorageStore[key];
      }),
      clear: vi.fn(() => {
        _sessionStorageStore = {};
      }),
    };

    Object.defineProperty(globalThis, "localStorage", {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, "sessionStorage", {
      value: sessionStorageMock,
      writable: true,
      configurable: true,
    });

    vi.clearAllMocks();

    (cleanCredentials as MockInstance).mockResolvedValue(undefined);
    (getAuthToken as MockInstance).mockResolvedValue(null);
    (getAuthRefreshToken as MockInstance).mockResolvedValue(null);
    (storeAuthToken as MockInstance).mockResolvedValue(undefined);
    (storeAuthRefreshToken as MockInstance).mockResolvedValue(undefined);

    (getSessionPersistencePreference as MockInstance).mockReturnValue(
      "session"
    );
    (configSession as MockInstance).mockImplementation(() => {});

    const mockAxiosInstance = {
      post: vi.fn().mockResolvedValue({
        data: { access_token: "new", refresh_token: "new" },
      }),
    };
    vi.mocked(getAxiosInstance).mockReturnValue(mockAxiosInstance);
    axiosPostMock = mockAxiosInstance.post;

    vi.mocked(handleError).mockClear();

    DateNowSpy = vi.spyOn(Date, "now").mockReturnValue(MOCK_DATE_NOW);

    vi.mocked(jwtDecode).mockImplementation((token: string) => {
      if (token === "valid-jwt") {
        return { exp: FUTURE_EXP_SECONDS };
      }
      if (token === "expired-jwt") {
        return { exp: PAST_EXP_SECONDS };
      }
      throw new Error("Invalid token");
    });

    realWindowLocation = window.location;
    windowLocationReloadSpy = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { reload: windowLocationReloadSpy, href: "http://localhost/" },
    });

    const tokensConfig = getTokenConfig();
    SECRET_KEY = getSecretKey();
    ENDPOINTS = getEndpointsConfig();

    const { useAuth: actualUseAuth } = await vi.importActual<
      typeof import("@composables/auth")
    >("@composables/auth");
    auth = actualUseAuth(SECRET_KEY);
  });

  afterEach(() => {
    localStorageMock.clear();
    sessionStorageMock.clear();
    vi.restoreAllMocks();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: realWindowLocation,
    });
  });

  describe("getJwt", () => {
    it("should retrieve the access token from storage using the current preference", async () => {
      vi.mocked(getSessionPersistencePreference).mockReturnValue("local");
      const { useAuth: currentUseAuth } = await vi.importActual<
        typeof import("@composables/auth")
      >("@composables/auth");
      auth = currentUseAuth(SECRET_KEY);
      vi.mocked(getAuthToken).mockResolvedValueOnce("mocked-access-token");

      const token = await auth.getJwt();

      expect(token).toBe("mocked-access-token");
      expect(getAuthToken).toHaveBeenCalledWith(SECRET_KEY, "local");
    });

    it("should return null if no access token is found and handle error", async () => {
      vi.mocked(getAuthToken).mockRejectedValueOnce(
        new Error("Token not found")
      );
      const token = await auth.getJwt();
      expect(token).toBeNull();
      expect(handleError).toHaveBeenCalled();
    });
  });

  describe("getTokenExpiry", () => {
    it("should return the token's expiration in milliseconds", async () => {
      vi.mocked(getAuthToken).mockResolvedValueOnce("valid-jwt");
      const expiry = await auth.getTokenExpiry();
      expect(expiry).toBe(FUTURE_EXP_SECONDS * 1000);
      expect(jwtDecode).toHaveBeenCalledWith("valid-jwt");
    });

    it("should return null if the token is invalid or unreadable and handle error", async () => {
      vi.mocked(getAuthToken).mockResolvedValueOnce("invalid-token");
      vi.mocked(jwtDecode).mockImplementationOnce(() => {
        throw new Error("Invalid token");
      });
      const expiry = await auth.getTokenExpiry();
      expect(expiry).toBeNull();
      expect(handleError).toHaveBeenCalled();
    });
  });

  describe("login", () => {
    it("should make a POST request and store tokens with 'local' preference", async () => {
      const mockResponse = {
        access_token: "new-valid-jwt-local",
        refresh_token: "new-refresh-token-local",
        user: { id: "1", name: "Test User" },
      };
      axiosPostMock.mockResolvedValueOnce({ data: mockResponse });

      const result = await auth.login(
        { username: "testuser", password: "testpassword" },
        "local"
      );

      expect(axiosPostMock).toHaveBeenCalledWith(ENDPOINTS.LOGIN, {
        username: "testuser",
        password: "testpassword",
      });
      expect(configSession).toHaveBeenCalledWith({
        persistencePreference: "local",
      });
      expect(storeAuthToken).toHaveBeenCalledWith(
        mockResponse.access_token,
        SECRET_KEY,
        "local"
      );
      expect(storeAuthRefreshToken).toHaveBeenCalledWith(
        mockResponse.refresh_token,
        SECRET_KEY,
        "local"
      );
      expect(result).toEqual(mockResponse);
    });

    it("should make a POST request and store tokens with 'session' preference", async () => {
      const mockResponse = {
        access_token: "new-valid-jwt-session",
        refresh_token: "new-refresh-token-session",
        user: { id: "2", name: "Session User" },
      };
      axiosPostMock.mockResolvedValueOnce({ data: mockResponse });

      const result = await auth.login(
        { username: "sessionuser", password: "sessionpassword" },
        "session"
      );

      expect(axiosPostMock).toHaveBeenCalledWith(ENDPOINTS.LOGIN, {
        username: "sessionuser",
        password: "sessionpassword",
      });
      expect(configSession).toHaveBeenCalledWith({
        persistencePreference: "session",
      });
      expect(storeAuthToken).toHaveBeenCalledWith(
        mockResponse.access_token,
        SECRET_KEY,
        "session"
      );
      expect(storeAuthRefreshToken).toHaveBeenCalledWith(
        mockResponse.refresh_token,
        SECRET_KEY,
        "session"
      );
      expect(result).toEqual(mockResponse);
    });

    it("should throw an error if the API request fails and handle it", async () => {
      const error = new Error("Login failed");
      axiosPostMock.mockRejectedValueOnce(error);
      await expect(
        auth.login({ username: "testuser", password: "testpassword" }, "local")
      ).rejects.toThrow(error);
      expect(handleError).toHaveBeenCalled();
    });
  });

  describe("refresh", () => {
    it("should renew tokens and store them using the current preference", async () => {
      vi.mocked(getSessionPersistencePreference).mockReturnValue("local");
      const { useAuth: currentUseAuth } = await vi.importActual<
        typeof import("@composables/auth")
      >("@composables/auth");
      auth = currentUseAuth(SECRET_KEY);

      vi.mocked(getAuthRefreshToken).mockResolvedValueOnce(
        "mock.refresh.token.local"
      );
      const mockResponse = {
        access_token: "refreshed-valid-jwt",
        refresh_token: "refreshed-refresh-token",
        user: { id: "1", name: "Test User" },
      };
      axiosPostMock.mockResolvedValueOnce({ data: mockResponse });

      const result = await auth.refresh();

      expect(getAuthRefreshToken).toHaveBeenCalledWith(SECRET_KEY, "local");
      expect(axiosPostMock).toHaveBeenCalledWith(ENDPOINTS.REFRESH, {
        refresh_token: "mock.refresh.token.local",
      });
      expect(storeAuthToken).toHaveBeenCalledWith(
        mockResponse.access_token,
        SECRET_KEY,
        "local"
      );
      expect(storeAuthRefreshToken).toHaveBeenCalledWith(
        mockResponse.refresh_token,
        SECRET_KEY,
        "local"
      );
      expect(result).toEqual(mockResponse);
    });

    it("should throw an error and log out if the refresh token is missing", async () => {
      vi.mocked(getAuthRefreshToken).mockResolvedValueOnce(null);
      await expect(auth.refresh()).rejects.toThrow("TOKEN_MISSING");
      expect(axiosPostMock).toHaveBeenCalledWith(ENDPOINTS.LOGOUT, {});
      expect(cleanCredentials).toHaveBeenCalledWith("session");
      expect(windowLocationReloadSpy).toHaveBeenCalled();
    });

    it("should throw an error and log out if refresh API fails", async () => {
      vi.mocked(getAuthRefreshToken).mockResolvedValueOnce(
        "some-refresh-token"
      );
      const error = new Error("Refresh API failed");
      axiosPostMock.mockRejectedValueOnce(error);
      await expect(auth.refresh()).rejects.toThrow(error);
      expect(axiosPostMock).toHaveBeenCalledWith(ENDPOINTS.LOGOUT, {});
      expect(cleanCredentials).toHaveBeenCalledWith("session");
      expect(windowLocationReloadSpy).toHaveBeenCalled();
    });
  });

  describe("logout", () => {
    it("should make a POST request, clear credentials with current preference, and reload the page", async () => {
      vi.mocked(getSessionPersistencePreference).mockReturnValue("local");
      const { useAuth: currentUseAuth } = await vi.importActual<
        typeof import("@composables/auth")
      >("@composables/auth");
      auth = currentUseAuth(SECRET_KEY);

      await auth.logout();
      expect(axiosPostMock).toHaveBeenCalledWith(ENDPOINTS.LOGOUT, {});
      expect(cleanCredentials).toHaveBeenCalledWith("local");
      expect(windowLocationReloadSpy).toHaveBeenCalled();
    });

    it("should handle error if logout API fails but still clear credentials and reload", async () => {
      axiosPostMock.mockRejectedValueOnce(new Error("Logout API error"));
      await auth.logout();
      expect(handleError).toHaveBeenCalled();
      expect(cleanCredentials).toHaveBeenCalledWith("session");
      expect(windowLocationReloadSpy).toHaveBeenCalled();
    });
  });

  describe("verifyAuth", () => {
    it("should return true for a valid and unexpired token", async () => {
      vi.mocked(getAuthToken).mockResolvedValueOnce("valid-jwt");
      const result = await auth.verifyAuth();
      expect(result).toBe(true);
      expect(getAuthToken).toHaveBeenCalledWith(SECRET_KEY, "session");
    });

    it("should throw a TOKEN_EXPIRED error if the token has expired, clean credentials and reload", async () => {
      vi.mocked(getAuthToken).mockResolvedValueOnce("expired-jwt");
      await expect(auth.verifyAuth()).rejects.toThrow("TOKEN_EXPIRED");
      expect(cleanCredentials).toHaveBeenCalledWith("session");
    });

    it("should throw a TOKEN_INVALID error if the token has an invalid format, clean credentials and reload", async () => {
      vi.mocked(getAuthToken).mockResolvedValueOnce("invalid-token");
      await expect(auth.verifyAuth()).rejects.toThrow("TOKEN_INVALID");
      expect(cleanCredentials).toHaveBeenCalledWith("session");
    });

    it("should throw a TOKEN_MISSING error if no token is found, clean credentials and reload", async () => {
      vi.mocked(getAuthToken).mockResolvedValueOnce(null);
      await expect(auth.verifyAuth()).rejects.toThrow("TOKEN_MISSING");
      expect(cleanCredentials).toHaveBeenCalledWith("session");
    });
  });
});
