import * as crypto from 'crypto';
import jwtDecode from 'jwt-decode';

/**
 * Decodes a JWT token payload using jwt-decode.
 * @param {string} token The JWT token to decode.
 * @returns {any} The decoded token payload.
 * @throws {Error} Throws an error if the token is invalid.
 */
export function jwtDecodePayload(token: string): any {
    try {
        return jwtDecode(token);
    } catch (error) {
        console.error('Failed to decode token payload:', error);
        throw new Error('Failed to decode token payload');
    }
}

/**
 * Extracts the header from a JWT token.
 * @param {string} token The JWT token to extract the header from.
 * @returns {any} The decoded JWT header.
 * @throws {Error} Throws an error if the token is invalid.
 */
export function jwtGetHeader(token: string): any {
    try {
        const [header] = token.split('.');
        if (!header) {
            throw new Error('Invalid token format');
        }
        return JSON.parse(atob(header));
    } catch (error) {
        console.error('Failed to decode JWT header:', error);
        throw new Error('Failed to decode JWT header');
    }
}

/**
 * Verifies the JWT signature.
 * @param {string} token The JWT token to verify.
 * @param {string} secret The secret key used for signing.
 * @returns {boolean} True if the signature is valid, false otherwise.
 * @throws {Error} Throws an error if verification fails.
 */
export function jwtVerifySignature(token: string, secret: string): boolean {
    try {
        const [header, payload, signature] = token.split('.');
        const data = `${header}.${payload}`;

        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(data);
        const expectedSignature = hmac.digest('base64');

        return signature === expectedSignature;
    } catch (error) {
        console.error('Failed to verify JWT signature:', error);
        throw new Error('Failed to verify JWT signature');
    }
}

/**
 * Extracts the expiration date from a JWT token payload.
 * @param {string} token The JWT token to extract the expiration from.
 * @returns {Date | null} The expiration date, or null if not present.
 */
export function jwtGetExpiration(token: string): Date | null {
    try {
        const decoded = jwtDecodePayload(token);
        if (decoded.exp) {
            return new Date(decoded.exp * 1000);
        }
        return null;
    } catch (error) {
        console.error('Failed to extract JWT expiration date:', error);
        return null;
    }
}

/**
 * Extracts the issued at date from a JWT token payload.
 * @param {string} token The JWT token to extract the issued at date from.
 * @returns {Date | null} The issued at date, or null if not present.
 */
export function jwtGetIssuedAt(token: string): Date | null {
    try {
        const decoded = jwtDecodePayload(token);
        if (decoded.iat) {
            return new Date(decoded.iat * 1000);
        }
        return null;
    } catch (error) {
        console.error('Failed to extract JWT issued at date:', error);
        return null;
    }
}

/**
 * Checks if a JWT token is expired.
 * @param {string} token The JWT token to check.
 * @returns {boolean} True if the token is expired, false otherwise.
 */
export function isTokenExpired(token: string): boolean {
    try {
        const expirationDate = jwtGetExpiration(token);
        if (expirationDate) {
            return expirationDate < new Date();
        }
        return false;
    } catch (error) {
        console.error('Error checking token expiration:', error);
        return false;
    }
}

/**
 * Verifies the JWT algorithm.
 * @param {string} token The JWT token to verify.
 * @param {string[]} allowedAlgorithms List of allowed algorithms.
 * @returns {boolean} True if the token uses an allowed algorithm, false otherwise.
 */
export function verifyJwtAlgorithm(token: string, allowedAlgorithms: string[]): boolean {
    try {
        const decodedHeader = jwtGetHeader(token);
        const algorithm = decodedHeader.alg;
        return allowedAlgorithms.includes(algorithm);
    } catch (error) {
        console.error('Error verifying JWT algorithm:', error);
        return false;
    }
}

/**
 * Verifies a specific claim in the JWT token.
 * @param {string} token The JWT token to verify.
 * @param {string} claim The claim to verify (e.g., 'aud', 'sub').
 * @param {any} expectedValue The expected value of the claim.
 * @returns {boolean} True if the claim matches the expected value, false otherwise.
 */
export function verifyJwtClaim(token: string, claim: string, expectedValue: any): boolean {
    try {
        const decodedPayload = jwtDecodePayload(token);
        return decodedPayload[claim] === expectedValue;
    } catch (error) {
        console.error('Error verifying JWT claim:', error);
        return false;
    }
}