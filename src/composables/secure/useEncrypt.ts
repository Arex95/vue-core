import CryptoJS from 'crypto-js';
import Cookies from 'js-cookie';

/**
 * Composable to handle encrypted storage in localStorage and cookies.
 * @param {string} secretKey - The key used for encryption and decryption.
 * @returns {object} Methods to securely set and get data from storage and cookies.
 */
export function useSecureStorage(secretKey: string) {

    /**
     * Encrypts data using the secret key.
     * @param {string} data - The data to encrypt.
     * @returns {string} The encrypted data.
     */
    const encrypt = (data: string): string => {
        return CryptoJS.AES.encrypt(data, secretKey).toString();
    };

    /**
     * Decrypts data using the secret key.
     * @param {string} encryptedData - The data to decrypt.
     * @returns {string} The decrypted data.
     */
    const decrypt = (encryptedData: string): string => {
        const bytes = CryptoJS.AES.decrypt(encryptedData, secretKey);
        return bytes.toString(CryptoJS.enc.Utf8);
    };

    /**
     * Saves data to localStorage with encryption.
     * @param {string} key - The storage key.
     * @param {any} value - The value to store.
     * @returns {void}
     */
    const setLocalStorage = (key: string, value: any): void => {
        const encryptedKey = encrypt(key);
        const encryptedValue = encrypt(JSON.stringify(value));
        localStorage.setItem(encryptedKey, encryptedValue);
    };

    /**
     * Retrieves and decrypts data from localStorage.
     * @param {string} key - The storage key.
     * @returns {any | null} The decrypted value or null if not found.
     */
    const getLocalStorage = (key: string): any | null => {
        const encryptedKey = encrypt(key);
        const encryptedValue = localStorage.getItem(encryptedKey);
        if (encryptedValue) {
            const decryptedValue = decrypt(encryptedValue);
            return JSON.parse(decryptedValue);
        }
        return null;
    };

    /**
     * Saves data to a cookie with encryption.
     * @param {string} key - The cookie key.
     * @param {any} value - The value to store.
     * @param {number} [expires=7] - Days until the cookie expires.
     * @returns {void}
     */
    const setCookie = (key: string, value: any, expires: number = 7): void => {
        const encryptedKey = encrypt(key);
        const encryptedValue = encrypt(JSON.stringify(value));
        Cookies.set(encryptedKey, encryptedValue, { expires });
    };

    /**
     * Retrieves and decrypts data from a cookie.
     * @param {string} key - The cookie key.
     * @returns {any | null} The decrypted value or null if not found.
     */
    const getCookie = (key: string): any | null => {
        const encryptedKey = encrypt(key);
        const encryptedValue = Cookies.get(encryptedKey);
        if (encryptedValue) {
            const decryptedValue = decrypt(encryptedValue);
            return JSON.parse(decryptedValue);
        }
        return null;
    };

    return {
        setLocalStorage,
        getLocalStorage,
        setCookie,
        getCookie,
    };
}