import * as CryptoJS from 'crypto-js'
import { computed } from 'vue'
import { jwtDecode } from 'jwt-decode'
import { getAxiosInstance } from '@config/axios'
import { handleError } from '@utils/errors'

let axiosInstance = getAxiosInstance()

let config = {
    endpoints: {
        login: 'login',
        refresh: 'refresh',
        logout: 'logout'
    },
    storageKeys: {
        token: 'app_storage_token',
        refreshToken: 'app_storage_refresh_token'
    }
}

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

const storeEncryptedItem = async (key: string, value: any, secretKey: string, attempt = 0): Promise<void> => {
    if (typeof window !== 'undefined' && window.localStorage) {
        try {
            localStorage.setItem(key, encrypt(value, secretKey))
            return
        } catch (error) {
            console.error(`Error storing ${key} on attempt ${attempt}`, error)
            if (attempt < 5) {
                await new Promise(resolve => setTimeout(resolve, 100))
                return await storeEncryptedItem(key, value, secretKey, attempt + 1)
            } else {
                throw new Error(`LocalStorage not available for key ${key} after multiple attempts`)
            }
        }
    } else {
        if (attempt < 5) {
            await new Promise(resolve => setTimeout(resolve, 100))
            return await storeEncryptedItem(key, value, secretKey, attempt + 1)
        } else {
            throw new Error(`LocalStorage not available for key ${key} after multiple attempts`)
        }
    }
}

function getDecryptedValue(key: string, secretKey: string) {
    try {
        const value = localStorage.getItem(key)
        return value ? decrypt(value, secretKey) : null
    } catch (error) {
        console.error(`Error decrypting key ${key}:`, error)
        return null
    }
}

export function useAuth(secretKey: string) {
    const jwt = computed(() => getDecryptedValue(config.storageKeys.token, secretKey))
    const refresh_token = computed(() => getDecryptedValue(config.storageKeys.refreshToken, secretKey))

    const tokenExpiry = computed(() => {
        if (!jwt.value) return null
        try {
            const decoded: { exp: number } = jwtDecode(<string>jwt.value)
            return decoded.exp * 1000
        } catch (error) {
            console.error('Error decoding JWT:', error)
            return null
        }
    })

    const login = async (params = {}) => {
        try {
            const response = await axiosInstance.post(config.endpoints.login, params)
            await storeEncryptedItem(config.storageKeys.token, response.data.token, secretKey)
            await storeEncryptedItem(config.storageKeys.refreshToken, response.data.refresh_token, secretKey)
            return response
        } catch (error) {
            throw error
        }
    }

    const refresh = async () => {
        try {
            const response = await axiosInstance.post(config.endpoints.refresh, {})
            await storeEncryptedItem(config.storageKeys.token, response.data.token, secretKey)
            await storeEncryptedItem(config.storageKeys.refreshToken, response.data.refresh_token, secretKey)
            return response
        } catch (error) {
            await logout()
        }
    }

    const logout = async (params = {}) => {
        try {
            await axiosInstance.post(config.endpoints.logout, params)
        } catch (error) {
            console.warn('Logout request failed:', error)
        } finally {
            await cleanStorage()
            location.reload()
        }
    }

    const cleanStorage = async () => {
        (Object.keys(config.storageKeys) as (keyof typeof config.storageKeys)[]).forEach(key => {
            localStorage.removeItem(config.storageKeys[key])
        })
    }

    const verifyToken = async () => {
        if (!jwt.value) {
            console.warn('TOKEN_MISSING')
            await cleanStorage()
            throw new Error('TOKEN_MISSING: No se encontró un token válido')
        }

        try {
            const decoded: { exp: number } = jwtDecode(<string>jwt.value)
            const now = Date.now()

            if (decoded.exp * 1000 < now) {
                console.warn('TOKEN_EXPIRED')
                await refresh()
            }
        } catch (error) {
            console.error('TOKEN_INVALID: Error al decodificar', error)
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