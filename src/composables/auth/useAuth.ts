import { computed } from "vue";
import { jwtDecode } from "jwt-decode";
import { getAxiosInstance } from "@config/axios";
import { handleError } from "@utils/errors";
import { getTokenConfig, getSecretKey } from "@/config/global/tokensConfig";
import { getEndpointsConfig } from "@config/global/endpointsConfig";
import { AuthConfig, TokensConfig } from "@/types";
import { computedAsync } from "@vueuse/core";

const tokensConfig = getTokenConfig();
const endpointsConfig = getEndpointsConfig();

const config: AuthConfig = {
  endpoints: endpointsConfig,
  storageKeys: tokensConfig,
};

/**
 * Configures authentication settings globally.
 * Allows modifying default endpoints and storage keys.
 *
 * @param {Object} options - Custom configuration options.
 * @param {Object} [options.endpoints] - Custom endpoints for login, refresh, and logout.
 * @param {Object} [options.storageKeys] - Custom storage keys for tokens.
 */
export function configureAuth(options: AuthConfig) {
  if (options.endpoints) {
    config.endpoints = { ...config.endpoints, ...options.endpoints };
  }
  if (options.storageKeys) {
    config.storageKeys = { ...config.storageKeys, ...options.storageKeys };
  }
}

function ab2hex(buffer: Uint8Array): string {
  return Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hex2ab(hex: string): Uint8Array {
  return new Uint8Array(
    hex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );
}

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
 *
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
 *
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
 *
 * @param {string} key - Storage key.
 * @param {string} value - Value to store.
 * @param {string} secretKey - Encryption key.
 * @param {boolean} isRememberMe - Whether to store in localStorage.
 * @param {number} [attempt=0] - Retry attempt count.
 * @returns {Promise<void>}
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
 * Retrieves and decrypts a stored value.
 *
 * @param {string} key - Storage key.
 * @param {string} secretKey - Decryption key.
 * @param {boolean} isRememberMe - Whether to retrieve from localStorage.
 * @returns {Promise<string|null>} The decrypted value or null.
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
 * Provides authentication utilities.
 *
 * @param {string} [secretKey=getSecretKey()] - Encryption key.
 * @returns {Object} Auth composable methods and properties.
 */
export function useAuth(secretKey = getSecretKey()) {

  const axiosInstance = getAxiosInstance();
  
  const jwt = computedAsync(
    async () =>
      await getDecryptedValue(
        config.storageKeys.ACCESS_TOKEN,
        secretKey,
        false
      ),
    null
  );
  const refresh_token = computedAsync(
    async () =>
      await getDecryptedValue(
        config.storageKeys.REFRESH_TOKEN,
        secretKey,
        false
      ),
    null
  );

  /**
   * Computes token expiration timestamp.
   */
  const tokenExpiry = computed(() => {
    if (!jwt.value) return null;
    try {
      const decoded = jwtDecode(jwt.value);
      return decoded.exp ? decoded.exp * 1000 : null;
    } catch (error) {
      handleError(error, false);
      return null;
    }
  });

  /**
   * Checks if the user is authenticated.
   */
  const isAuthenticated = computed(() => {
    if (!jwt.value || jwt.value.length === 0) {
      return false;
    }
    if (tokenExpiry.value === null) {
      return false;
    }
    return tokenExpiry.value > Date.now();
  });

  /**
   * Handles user login.
   */
  const login = async (params = {}, isRememberMe: boolean) => {
    try {
      const response = await axiosInstance.post(config.endpoints.LOGIN, params);
      await storeEncryptedItem(
        config.storageKeys.ACCESS_TOKEN,
        response.data.token,
        secretKey,
        isRememberMe
      );
      await storeEncryptedItem(
        config.storageKeys.REFRESH_TOKEN,
        response.data.refresh_token,
        secretKey,
        isRememberMe
      );
      return response;
    } catch (error) {
      handleError(error, false);
      throw error;
    }
  };

  /**
   * Refreshes authentication token.
   */
  const refresh = async () => {
    try {
      const response = await axiosInstance.post(config.endpoints.REFRESH, {});
      await storeEncryptedItem(
        config.storageKeys.ACCESS_TOKEN,
        response.data.token,
        secretKey,
        false
      );
      await storeEncryptedItem(
        config.storageKeys.REFRESH_TOKEN,
        response.data.refresh_token,
        secretKey,
        false
      );
      return response;
    } catch (error) {
      handleError(error, false);
      await logout();
    }
  };

  /**
   * Logs out the user.
   */
  const logout = async (params = {}) => {
    try {
      await axiosInstance.post(config.endpoints.LOGOUT, params);
    } catch (error) {
      handleError(error, false);
    } finally {
      await cleanStorage();
      location.reload();
    }
  };

  /**
   * Clears stored authentication data.
   */
  const cleanStorage = async () => {
    (Object.keys(config.storageKeys) as (keyof TokensConfig)[]).forEach(
      (key) => {
        sessionStorage.removeItem(config.storageKeys[key]);
        localStorage.removeItem(config.storageKeys[key]);
      }
    );
  };

  /**
   * Verifies token validity.
   */
  const verifyToken = async () => {
    if (!jwt.value) {
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
      const decoded = jwtDecode(jwt.value);
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
    isAuthenticated,
    jwt,
    refresh_token,
    tokenExpiry,
    login,
    refresh,
    logout,
    cleanStorage,
    verifyToken,
  };
}
