let secretKey: string = '12345678901234567890123456789012'

interface TokenConfig {
  readonly ACCESS_TOKEN: string
  readonly REFRESH_TOKEN: string
}

let tokenConfig: TokenConfig = Object.freeze({
  ACCESS_TOKEN: 'authToken',
  REFRESH_TOKEN: 'refreshToken',
})

/**
 * Configura las claves globales para los tokens de acceso y refresh.
 * Una vez establecidas, no pueden ser modificadas.
 * @param accessTokenKey - Nombre de la clave del token de acceso.
 * @param refreshTokenKey - Nombre de la clave del refresh token.
 */
export function setTokenConfig(accessTokenKey: string, refreshTokenKey: string) {
  tokenConfig = Object.freeze({
    ACCESS_TOKEN: accessTokenKey,
    REFRESH_TOKEN: refreshTokenKey,
  })
}

/**
 * Obtiene la configuración actual de las claves de tokens.
 * @returns Configuración de los tokens.
 */
export function getTokenConfig(): TokenConfig {
  return tokenConfig
}

/**
 * Establece la clave secreta para su uso en autenticación.
 * @param key - Nueva clave secreta.
 */
export function setSecretKey(key: string) {
  secretKey = key
}

/**
 * Obtiene la clave secreta actual.
 * @returns Clave secreta configurada.
 */
export function getSecretKey(): string {
  return secretKey
}