import * as CryptoJS from 'crypto-js'
import { computed } from 'vue'
import { jwtDecode } from 'jwt-decode'
import { getAxiosInstance } from '@config/axios'
import { handleError } from '@utils/errors'
import { getTokenConfig, getSecretKey } from '@/config/global/tokensConfig'
import { getEndpointsConfig } from '@config/global/endpointsConfig'
import { AuthConfig, TokensConfig } from "@/types";

const axiosInstance = getAxiosInstance()
const tokensConfig = getTokenConfig()
const endpointsConfig = getEndpointsConfig()

const config: AuthConfig = {
  endpoints: endpointsConfig,
  storageKeys: tokensConfig,
}

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
    config.endpoints = { ...config.endpoints, ...options.endpoints }
  }
  if (options.storageKeys) {
    config.storageKeys = { ...config.storageKeys, ...options.storageKeys }
  }
}

/**
 * Encrypts a value using AES encryption.
 *
 * @param {string} value - The value to encrypt.
 * @param {string} key - The encryption key.
 * @returns {string} The encrypted string.
 */
const encrypt = (value: string, key: string) => {
  return CryptoJS.AES.encrypt(value, key).toString()
}

/**
 * Decrypts an AES encrypted value.
 *
 * @param {string} value - The encrypted value.
 * @param {string} key - The encryption key.
 * @returns {string} The decrypted string.
 */
const decrypt = (value: string, key: string) => {
  const bytes = CryptoJS.AES.decrypt(value, key);
  return bytes.toString(CryptoJS.enc.Utf8);
};

/**
 * Stores an encrypted value in sessionStorage or localStorage.
 *
 * @param {string} key - Storage key.
 * @param {any} value - Value to store.
 * @param {string} secretKey - Encryption key.
 * @param {boolean} isRememberMe - Whether to store in localStorage.
 * @param {number} [attempt=0] - Retry attempt count.
 * @returns {Promise<void>} 
 */
const storeEncryptedItem = async (
  value: string,
  key: string,
  secretKey: string,
  isRememberMe: boolean,
  attempt: number = 0
) => {
  const storage = isRememberMe ? localStorage : sessionStorage;
  if (typeof window !== "undefined" && storage) {
    try {
      storage.setItem(key, encrypt(value, secretKey));
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
 * @returns {string|null} The decrypted value or null.
 */
function getDecryptedValue(key: string, secretKey: string, isRememberMe: boolean) {
  const storage = isRememberMe ? localStorage : sessionStorage
  try {
    const value = storage.getItem(key)
    return value ? decrypt(value, secretKey) : null
  } catch (error) {
    handleError(error, false)
    return null
  }
}

/**
 * Provides authentication utilities.
 *
 * @param {string} [secretKey=getSecretKey()] - Encryption key.
 * @returns {Object} Auth composable methods and properties.
 */
export function useAuth(secretKey = getSecretKey()) {
  const jwt = computed(() => getDecryptedValue(config.storageKeys.ACCESS_TOKEN, secretKey, false))
  const refresh_token = computed(() => getDecryptedValue(config.storageKeys.REFRESH_TOKEN, secretKey, false))

  /**
   * Computes token expiration timestamp.
   */
  const tokenExpiry = computed(() => {
    if (!jwt.value) return null
    try {
      const decoded = jwtDecode(jwt.value)
      return decoded.exp ? decoded.exp * 1000 : null
    } catch (error) {
      handleError(error, false)
      return null
    }
  })

  /**
   * Checks if the user is authenticated.
   */
  const isAuthenticated = computed(() => {
    if (!jwt.value || jwt.value.length === 0) {
      return false
    }
    if (tokenExpiry.value === null) {
      return false
    }
    return tokenExpiry.value > Date.now()
  })

  /**
   * Handles user login.
   */
  const login = async (params = {}, isRememberMe: boolean) => {
    try {
      const response = await axiosInstance.post(config.endpoints.LOGIN, params)
      await storeEncryptedItem(config.storageKeys.ACCESS_TOKEN, response.data.token, secretKey, isRememberMe)
      await storeEncryptedItem(config.storageKeys.REFRESH_TOKEN, response.data.refresh_token, secretKey, isRememberMe)
      return response
    } catch (error) {
      handleError(error, false)
      throw error
    }
  }

  /**
   * Refreshes authentication token.
   */
  const refresh = async () => {
    try {
      const response = await axiosInstance.post(config.endpoints.REFRESH, {})
      await storeEncryptedItem(config.storageKeys.ACCESS_TOKEN, response.data.token, secretKey, false)
      await storeEncryptedItem(config.storageKeys.REFRESH_TOKEN, response.data.refresh_token, secretKey, false)
      return response
    } catch (error) {
      handleError(error, false)
      await logout()
    }
  }

  /**
   * Logs out the user.
   */
  const logout = async (params = {}) => {
    try {
      await axiosInstance.post(config.endpoints.LOGOUT, params)
    } catch (error) {
      handleError(error, false)
    } finally {
      await cleanStorage()
      location.reload()
    }
  }

  /**
   * Clears stored authentication data.
   */
  const cleanStorage = async () => {
    (Object.keys(config.storageKeys) as (keyof TokensConfig)[]).forEach(key => {
      sessionStorage.removeItem(config.storageKeys[key])
      localStorage.removeItem(config.storageKeys[key])
    })
  }

  /**
   * Verifies token validity.
   */
  const verifyToken = async () => {
    if (!jwt.value) {
      handleError('TOKEN_MISSING: No valid token found', true, '/auth-error', 'query')
      await cleanStorage()
      throw new Error('TOKEN_MISSING: No valid token found')
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
  }

  return {
    isAuthenticated,
    jwt,
    refresh_token,
    tokenExpiry,
    login,
    refresh,
    logout,
    cleanStorage,
    verifyToken
  }
}