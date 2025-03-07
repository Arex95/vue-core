/**
 * Composable that returns environment variables globally, including common Vite defaults and custom environment variables.
 * @returns {Record<string, string | boolean | undefined> & { isDev: boolean, isProd: boolean, isTest: boolean }}
 * Environment variables with isDev, isProd, and isTest flags.
 */
export const useEnv = () => {
    const { MODE, DEV, PROD, SSR } = import.meta.env
    const vite_env = import.meta.env
    const api: string = vite_env.VITE_API_URL ?? ''
    const api_dev: string = vite_env.VITE_DEV_API_URL ?? ''
    const api_prod: string = vite_env.VITE_PROD_API_URL ?? ''

    return {
        // Vite environment variables
        MODE,                       // Current mode ('development', 'production', etc.)
        DEV,                        // Boolean: true if in development mode
        PROD,                       // Boolean: true if in production mode
        SSR,                        // Boolean: true if server-side rendering

        // Utility flags
        isDev: MODE === 'development',   // Boolean: true if in development mode
        isProd: MODE === 'production',   // Boolean: true if in production mode
        isTest: MODE === 'test',         // Boolean: true if in test mode

        // Add custom environment variables from your .env file here
        vite_env,
        api,
        api_dev,
        api_prod,
    }
}