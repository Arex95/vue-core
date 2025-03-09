let tokenConfig = {
    ACCESS_TOKEN: 'authToken',
    REFRESH_TOKEN: 'refreshToken',
}

/**
 * Función para configurar las claves globalmente.
 * Esta función congela el objeto para evitar modificaciones posteriores.
 * @param {string} accessTokenKey - Nombre de la clave del token de acceso
 * @param {string} refreshTokenKey - Nombre de la clave del refresh token
 */
export function configureTokenKeys(accessTokenKey: string, refreshTokenKey: string) {
    tokenConfig = Object.freeze({
        ACCESS_TOKEN: accessTokenKey,
        REFRESH_TOKEN: refreshTokenKey,
    })
}

/**
 * Obtiene las claves configuradas para los tokens.
 * El objeto está congelado, por lo que no se puede modificar directamente.
 */
export function getTokenConfig() {
    return tokenConfig
}