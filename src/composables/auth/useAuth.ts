import * as CryptoJS from 'crypto-js'
import { computed } from 'vue'
import { jwtDecode } from 'jwt-decode'
import { getAxiosInstance } from '@config/axios'
import { handleError } from '@utils/errors'
import { getTokenConfig, getSecretKey } from '@config/global/tokenConfig'
import { getEndpointsConfig } from '@config/global/endpointsConfig'

let axiosInstance = getAxiosInstance()
const tokenConfig = getTokenConfig()
const endpointsConfig = getEndpointsConfig()

let config = {
  endpoints: endpointsConfig,
  storageKeys: tokenConfig,
}

/**
 * Función para configurar los endpoints y las claves de almacenamiento globalmente.
 * Permite modificar los valores predeterminados de los endpoints y claves de almacenamiento.
 * 
 * @param {Object} options - Configuración personalizada.
 * @param {Object} options.endpoints - Endpoints personalizados para login, refresh y logout.
 * @param {Object} options.storageKeys - Claves personalizadas para el almacenamiento de tokens.
 */
export function configureAuth(options: {
  endpoints?: { login?: string, refresh?: string, logout?: string },
  storageKeys?: { token?: string, refreshToken?: string }
}) {
  if (options.endpoints) {
    config.endpoints = { ...config.endpoints, ...options.endpoints }
  }
  if (options.storageKeys) {
    config.storageKeys = { ...config.storageKeys, ...options.storageKeys }
  }
}

const encrypt = (value: string, key: string) => {
  return CryptoJS.AES.encrypt(value, key).toString()
}

const decrypt = (value: string, key: string) => {
  const bytes = CryptoJS.AES.decrypt(value, key)
  return bytes.toString(CryptoJS.enc.Utf8)
}

const storeEncryptedItem = async (key: string, value: any, secretKey: string, isRememberMe: boolean, attempt = 0): Promise<void> => {
  const storage = isRememberMe ? localStorage : sessionStorage
  if (typeof window !== 'undefined' && storage) {
    try {
      storage.setItem(key, encrypt(value, secretKey))
      return
    } catch (error) {
      handleError(error, false)
      if (attempt < 5) {
        await new Promise(resolve => setTimeout(resolve, 100))
        return await storeEncryptedItem(key, value, secretKey, isRememberMe, attempt + 1)
      }
      throw new Error(`Storage not available for key ${key} after multiple attempts`)
    }
  } else {
    if (attempt < 5) {
      await new Promise(resolve => setTimeout(resolve, 100))
      return await storeEncryptedItem(key, value, secretKey, isRememberMe, attempt + 1)
    }
    throw new Error(`Storage not available for key ${key} after multiple attempts`)
  }
}

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

export function useAuth(secretKey: string = getSecretKey()) {
  const jwt = computed(() => getDecryptedValue(config.storageKeys.ACCESS_TOKEN, secretKey, false))
  const refresh_token = computed(() => getDecryptedValue(config.storageKeys.REFRESH_TOKEN, secretKey, false))

  const tokenExpiry = computed(() => {
    if (!jwt.value) return null
    try {
      const decoded: { exp: number } = jwtDecode(<string>jwt.value)
      return decoded.exp * 1000
    } catch (error) {
      handleError(error, false)
      return null
    }
  })

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

  const cleanStorage = async () => {
    (Object.keys(config.storageKeys) as (keyof typeof config.storageKeys)[]).forEach(key => {
      sessionStorage.removeItem(config.storageKeys[key])
      localStorage.removeItem(config.storageKeys[key])
    })
  }

  const verifyToken = async () => {
    if (!jwt.value) {
      handleError('TOKEN_MISSING: No se encontró un token válido', true, '/auth-error', 'query')
      await cleanStorage()
      throw new Error('TOKEN_MISSING: No se encontró un token válido')
    }

    try {
      const decoded: { exp: number } = jwtDecode(<string>jwt.value)
      const now = Date.now()

      if (decoded.exp * 1000 < now) {
        handleError('TOKEN_EXPIRED', false)
        await refresh()
      }
    } catch (error) {
      handleError('TOKEN_INVALID: No se pudo verificar el token', true, '/auth-error', 'query')
      await cleanStorage()
      throw new Error('TOKEN_INVALID: No se pudo verificar el token')
    }
  }

  return {
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