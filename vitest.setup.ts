import { vi, beforeEach } from "vitest";

vi.mock("@config/axios", () => ({
  getAxiosInstance: vi.fn(() => ({
    post: vi.fn(),
    get: vi.fn(),
  })),
}));

vi.mock("@utils/errors", () => ({
  handleError: vi.fn(),
}));

vi.mock("@config/global/tokensConfig", () => ({
  getTokenConfig: vi.fn(() => ({
    ACCESS_TOKEN: "vitest_access_token",
    REFRESH_TOKEN: "vitest_refresh_token",
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
  jwtDecode: vi.fn((token: string) => {
    if (token === "valid-jwt") {
      return { exp: Math.floor(Date.now() / 1000) + 3600 };
    }
    if (token === "expired-jwt") {
      return { exp: Math.floor(Date.now() / 1000) - 3600 };
    }
    if (token === "future-jwt") {
      return { exp: Math.floor(Date.now() / 1000) + 1000 };
    }
    if (token === "non-exp-jwt") {
      return {};
    }
    throw new Error("Invalid token for mock");
  }),
}));

Object.defineProperty(window, "location", {
  value: {
    reload: vi.fn(),
  },
  writable: true,
});

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
