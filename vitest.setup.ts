import { vi } from "vitest";

vi.mock("@config/axios", () => ({
  getAxiosInstance: vi.fn(),
}));

vi.mock("@utils/errors", () => ({
  handleError: vi.fn(),
}));

vi.mock("@config/global/tokensConfig", () => ({
  getTokenConfig: vi.fn(() => ({
    ACCESS_TOKEN: "access_token",
    REFRESH_TOKEN: "refresh_token",
  })),
  getSecretKey: vi.fn(() => "default-test-secret-key"),
}));

vi.mock("@config/global/endpointsConfig", () => ({
  getEndpointsConfig: vi.fn(() => ({
    LOGIN: "/api/login",
    REFRESH: "/api/refresh",
    LOGOUT: "/api/logout",
  })),
}));

vi.mock("jwt-decode", () => ({
  jwtDecode: vi.fn(),
}));

vi.mock("@utils/storage", () => ({
  storeEncryptedItem: vi.fn(() => Promise.resolve()),
  getDecryptedItem: vi.fn((key) => {
    return Promise.resolve(null);
  }),
  cleanStorage: vi.fn(() => {
    localStorage.clear();
    sessionStorage.clear();
  }),
}));
