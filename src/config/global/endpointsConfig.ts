let endpointsConfig = {
    LOGIN: '/login',
    REFRESH: '/refresh',
    LOGOUT: '/logout',
}

/**
 * Configura las URLs de los endpoints de autenticación globalmente.
 * Esta función congela el objeto para evitar modificaciones posteriores.
 * 
 * @param {string} loginEndpoint - URL del endpoint para el login.
 * @param {string} refreshEndpoint - URL del endpoint para el refresh token.
 * @param {string} logoutEndpoint - URL del endpoint para el logout.
 * 
 * @returns {void} No retorna nada, pero congela el objeto de configuración de endpoints.
 */
export function configureEndpoints(
    loginEndpoint: string, 
    refreshEndpoint: string, 
    logoutEndpoint: string
): void {
    endpointsConfig = Object.freeze({
        LOGIN: loginEndpoint,
        REFRESH: refreshEndpoint,
        LOGOUT: logoutEndpoint,
    })
}

/**
 * Obtiene las URLs de los endpoints de autenticación configurados.
 * 
 * @returns {Object} Objeto con las URLs de los endpoints configurados.
 * @returns {string} returns.LOGIN - URL del endpoint de login.
 * @returns {string} returns.REFRESH - URL del endpoint de refresh token.
 * @returns {string} returns.LOGOUT - URL del endpoint de logout.
 */
export function getEndpointsConfig() {
    return endpointsConfig
}