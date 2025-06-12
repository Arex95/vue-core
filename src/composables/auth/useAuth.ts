import { jwtDecode } from "jwt-decode";
import { getAxiosInstance } from "@config/axios";
import { handleError } from "@utils/errors";
import { getTokenConfig, getSecretKey } from "@/config/global/tokensConfig";
import { getEndpointsConfig } from "@config/global/endpointsConfig";
import { AuthConfig, TokensConfig } from "@/types";

/**
 * Converts an ArrayBuffer to a hexadecimal string.
 * @param {Uint8Array} buffer - The Uint8Array to convert.
 * @returns {string} The hexadecimal string representation.
 */
function ab2hex(buffer: Uint8Array): string {
  return Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Converts a hexadecimal string to a Uint8Array.
 * @param {string} hex - The hexadecimal string to convert.
 * @returns {Uint8Array} The Uint8Array representation.
 */
function hex2ab(hex: string): Uint8Array {
  return new Uint8Array(
    hex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );
}

/**
 * Imports a secret key for cryptographic operations.
 * @param {string} secretKey - The string secret key.
 * @returns {Promise<CryptoKey>} A Promise that resolves to the CryptoKey.
 */
async function importKey(secretKey: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(secretKey)
  );
  return await crypto.subtle.importKey(
    "raw",
    keyMaterial,
    { name: "AES-CBC", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts a value using AES-256 CBC encryption with Web Cryptography API.
 * The IV is generated randomly for each encryption and prepended to the ciphertext.
 * @param {string} value - The value to encrypt.
 * @param {string} secretKey - The encryption key string.
 * @returns {Promise<string>} A promise that resolves to the encrypted string (hex IV + hex ciphertext).
 */
const encrypt = async (value: string, secretKey: string): Promise<string> => {
  const key = await importKey(secretKey);
  const textEncoder = new TextEncoder();
  const data = textEncoder.encode(value);
  const iv = crypto.getRandomValues(new Uint8Array(16));

  const encryptedContentBuffer = await crypto.subtle.encrypt(
    { name: "AES-CBC", iv: iv },
    key,
    data
  );

  const encryptedContentUint8 = new Uint8Array(encryptedContentBuffer);

  return ab2hex(iv) + ab2hex(encryptedContentUint8);
};

/**
 * Decrypts an AES-256 CBC encrypted value using Web Cryptography API.
 * The IV is extracted from the beginning of the encrypted string.
 * @param {string} value - The encrypted string (hex IV + hex ciphertext).
 * @param {string} secretKey - The decryption key string.
 * @returns {Promise<string>} A promise that resolves to the decrypted string.
 */
const decrypt = async (value: string, secretKey: string): Promise<string> => {
  const key = await importKey(secretKey);
  const iv = hex2ab(value.substring(0, 32));
  const encryptedData = hex2ab(value.substring(32));

  const decryptedContent = await crypto.subtle.decrypt(
    { name: "AES-CBC", iv: iv },
    key,
    encryptedData
  );

  return new TextDecoder().decode(decryptedContent);
};

/**
 * Stores an encrypted value in sessionStorage or localStorage.
 * @param {string} key - Storage key.
 * @param {string} value - Value to store.
 * @param {string} secretKey - Encryption key.
 * @param {boolean} isRememberMe - Whether to store in localStorage (true) or sessionStorage (false).
 * @param {number} [attempt=0] - Retry attempt count.
 * @returns {Promise<void>} A Promise that resolves when the item is stored.
 * @throws {Error} If storage is not available after multiple attempts.
 */
const storeEncryptedItem = async (
  key: string,
  value: string,
  secretKey: string,
  isRememberMe: boolean,
  attempt: number = 0
): Promise<void> => {
  const storage = isRememberMe ? localStorage : sessionStorage;
  if (typeof window !== "undefined" && storage) {
    try {
      const encryptedValue = await encrypt(value, secretKey);
      storage.setItem(key, encryptedValue);
      return;
    } catch (error) {
      handleError(error, false);
      if (attempt < 5) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return await storeEncryptedItem(
          key,
          value,
          secretKey,
          isRememberMe,
          attempt + 1
        );
      }
      throw new Error(
        `Storage not available for key ${key} after multiple attempts`
      );
    }
  } else {
    if (attempt < 5) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return await storeEncryptedItem(
        key,
        value,
        secretKey,
        isRememberMe,
        attempt + 1
      );
    }
    throw new Error(
      `Storage not available for key ${key} after multiple attempts`
    );
  }
};

/**
 * Retrieves and decrypts a stored value from sessionStorage or localStorage.
 * @param {string} key - Storage key.
 * @param {string} secretKey - Decryption key.
 * @param {boolean} isRememberMe - Whether to retrieve from localStorage (true) or sessionStorage (false).
 * @returns {Promise<string|null>} The decrypted value or null if not found or decryption fails.
 */
async function getDecryptedValue(
  key: string,
  secretKey: string,
  isRememberMe: boolean
): Promise<string | null> {
  const storage = isRememberMe ? localStorage : sessionStorage;
  try {
    const value = storage.getItem(key);
    if (!value) return null;
    return await decrypt(value, secretKey);
  } catch (error) {
    handleError(error, false);
    return null;
  }
}

/**
 * Interface for the structure of JWT payload.
 */
interface DecodedJwtPayload {
  exp?: number;
  iat?: number;
  nbf?: number;
  iss?: string;
  sub?: string;
  aud?: string | string[];
  [key: string]: unknown;
}

/**
 * Interface for the expected structure of a successful login response from the API.
 */
interface LoginResponse {
  access_token: string;
  refresh_token: string;
  [key: string]: unknown;
}

/**
 * Interface for the expected structure of a successful token refresh response from the API.
 */
interface RefreshResponse {
  access_token: string;
  refresh_token: string;
  [key: string]: unknown;
}

/**
 * A Vue composable that provides authentication utilities, enforcing asynchronous access to tokens.
 * All token-related properties and status checks are awaitable functions.
 * @param {string} [secretKey=getSecretKey()] - The encryption/decryption key. Defaults to a globally configured key.
 * @returns {object} An object containing asynchronous authentication methods and properties.
 */
export function useAuth(secretKey = getSecretKey()) {
  const axiosInstance = getAxiosInstance();
  const tokensConfig = getTokenConfig();
  const endpointsConfig = getEndpointsConfig();

  const authConfig: AuthConfig = {
    endpoints: endpointsConfig,
    storageKeys: tokensConfig,
  };

  /**
   * Asynchronously retrieves and decrypts the Access Token (JWT) from storage.
   * This function should always be awaited.
   * @returns {Promise<string|null>} A promise that resolves to the decrypted JWT string or null if not found.
   */
  const getJwt = async (): Promise<string | null> => {
    return await getDecryptedValue(
      authConfig.storageKeys.ACCESS_TOKEN,
      secretKey,
      false
    );
  };

  /**
   * Asynchronously retrieves and decrypts the Refresh Token from storage.
   * This function should always be awaited.
   * @returns {Promise<string|null>} A promise that resolves to the decrypted Refresh Token string or null if not found.
   */
  const getRefreshToken = async (): Promise<string | null> => {
    return await getDecryptedValue(
      authConfig.storageKeys.REFRESH_TOKEN,
      secretKey,
      true
    );
  };

  /**
   * Asynchronously computes the expiration timestamp of the current Access Token.
   * Requires awaiting the JWT.
   * @returns {Promise<number|null>} A promise that resolves to the expiration timestamp in milliseconds (Unix epoch) or null if no valid token is found or parsing fails.
   */
  const getTokenExpiry = async (): Promise<number | null> => {
    const token = await getJwt();
    if (!token) return null;
    try {
      const decoded: DecodedJwtPayload = jwtDecode(token);
      return decoded.exp ? decoded.exp * 1000 : null;
    } catch (error) {
      handleError(error, false);
      return null;
    }
  };

  /**
   * Asynchronously checks if the user is currently authenticated and if the Access Token is valid and not expired.
   * This function should always be awaited.
   * @returns {Promise<boolean>} A promise that resolves to true if authenticated and token is valid, false otherwise.
   */
  const isAuthenticated = async (): Promise<boolean> => {
    const token = await getJwt();
    if (!token || token.length === 0) {
      return false;
    }
    const expiry = await getTokenExpiry();
    if (expiry === null) {
      return false;
    }
    return expiry > Date.now();
  };

  /**
   * Handles user login by making an API request and storing the received tokens.
   * @param {object} [params={}] - The login credentials or payload.
   * @param {boolean} isRememberMe - Indicates whether the refresh token should be stored in localStorage.
   * @returns {Promise<LoginResponse>} A promise that resolves to the API response data on successful login.
   * @throws {Error} If the login request fails.
   */
  const login = async (
    params: object = {},
    isRememberMe: boolean
  ): Promise<LoginResponse> => {
    try {
      const response = await axiosInstance.post<LoginResponse>(
        authConfig.endpoints.LOGIN,
        params
      );
      const newAccessToken = response.data.access_token;
      const newRefreshToken = response.data.refresh_token;

      await storeEncryptedItem(
        authConfig.storageKeys.ACCESS_TOKEN,
        newAccessToken,
        secretKey,
        false
      );
      await storeEncryptedItem(
        authConfig.storageKeys.REFRESH_TOKEN,
        newRefreshToken,
        secretKey,
        isRememberMe
      );
      return response.data;
    } catch (error) {
      handleError(error, false);
      throw error;
    }
  };

  /**
   * Refreshes the authentication token by making an API request and updating stored tokens.
   * @returns {Promise<RefreshResponse>} A promise that resolves to the API response data on successful refresh.
   * @throws {Error} If the refresh request fails, leading to logout.
   */
  const refresh = async (): Promise<RefreshResponse> => {
    try {
      const response = await axiosInstance.post<RefreshResponse>(
        authConfig.endpoints.REFRESH,
        {}
      );
      const newAccessToken = response.data.access_token;
      const newRefreshToken = response.data.refresh_token;

      await storeEncryptedItem(
        authConfig.storageKeys.ACCESS_TOKEN,
        newAccessToken,
        secretKey,
        false
      );
      await storeEncryptedItem(
        authConfig.storageKeys.REFRESH_TOKEN,
        newRefreshToken,
        secretKey,
        true
      );
      return response.data;
    } catch (error) {
      handleError(error, false);
      await logout();
      throw error;
    }
  };

  /**
   * Handles user logout by making an API request and clearing stored authentication data.
   * Reloads the page after clearing storage.
   * @param {object} [params={}] - Optional logout payload.
   * @returns {Promise<void>} A promise that resolves when the logout process is complete.
   */
  const logout = async (params: object = {}): Promise<void> => {
    try {
      await axiosInstance.post<void>(authConfig.endpoints.LOGOUT, params);
    } catch (error) {
      handleError(error, false);
    } finally {
      await cleanStorage();
      location.reload();
    }
  };

  /**
   * Clears all stored authentication data (access and refresh tokens) from both sessionStorage and localStorage.
   * @returns {Promise<void>} A promise that resolves when all relevant storage items are removed.
   */
  const cleanStorage = async (): Promise<void> => {
    (Object.keys(authConfig.storageKeys) as (keyof TokensConfig)[]).forEach(
      (key) => {
        sessionStorage.removeItem(authConfig.storageKeys[key]);
        localStorage.removeItem(authConfig.storageKeys[key]);
      }
    );
  };

  /**
   * Verifies the validity of the current Access Token. If the token is missing, invalid, or expired,
   * it handles the error appropriately (e.g., attempts refresh, clears storage, redirects).
   * This function should always be awaited.
   * @returns {Promise<void>} A promise that resolves if the token is valid, or rejects with an error.
   * @throws {Error} If the token is missing, expired, or invalid.
   */
  const verifyToken = async (): Promise<void> => {
    const token = await getJwt();

    if (!token) {
      handleError(
        "TOKEN_MISSING: No valid token found",
        true,
        "/auth-error",
        "query"
      );
      await cleanStorage();
      throw new Error("TOKEN_MISSING: No valid token found");
    }
    try {
      const decoded: DecodedJwtPayload = jwtDecode(token);
      if (decoded.exp ? decoded.exp * 1000 < Date.now() : false) {
        handleError("TOKEN_EXPIRED", false);
        await refresh();
      }
    } catch (error: unknown) {
      let errorMessage = "TOKEN_INVALID: Token verification failed";
      if (error instanceof Error) {
        errorMessage = `${errorMessage} - ${error.message}`;
      }
      handleError(errorMessage, true, "/auth-error", "query");
      await cleanStorage();
      throw new Error(errorMessage);
    }
  };

  return {
    getJwt,
    getRefreshToken,
    isAuthenticated,
    getTokenExpiry,
    login,
    refresh,
    logout,
    cleanStorage,
    verifyToken,
  };
}
