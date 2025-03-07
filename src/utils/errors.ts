export type ErrorType =
    'warning' |
    'error' |
    'critical' |
    'validation' |
    'component' |
    'network' |
    'authentication' |
    'runtime';

/**
 * Handles error messages with enhanced functionalities, including redirection to an error page.
 *
 * @param {string | Error} error - The error message or object to handle.
 * @param {boolean} [log=true] - Optional flag to indicate if the error should be logged.
 * @param {boolean} [notify=true] - Optional flag to indicate if the user should be notified.
 * @param {string} [context] - Optional context where the error occurred (e.g., 'network', 'component').
 * @param {boolean} [retry=false] - Optional flag to attempt a retry for recoverable errors.
 * @param {Object} [globalConfig] - Optional global configuration for error handling.
 * @param {boolean} [globalConfig.logToService] - Optional flag to indicate if errors should be logged to an external service.
 * @param {boolean} [globalConfig.notifyUser] - Optional flag to indicate if users should be notified.
 */
export function handleError(
    error: string | Error | null | undefined,
    log: boolean = true,
    notify: boolean = false,
    context?: string,
    retry: boolean = false,
    globalConfig?: { logToService?: boolean, notifyUser?: boolean }
) {
    // Return early if the error is null or undefined
    if (error == null) {
        return;
    }

    const router = useRouter();
    const currentPath = router.currentRoute.value.path;

    const type: ErrorType = inferErrorType(error);

    const shouldLog = globalConfig?.logToService ?? log;
    const shouldNotify = globalConfig?.notifyUser ?? notify;

    function logError() {
        if (shouldLog) {
            console.error(`[${type.toUpperCase()}] ${typeof error === 'string' ? error : error?.message || 'Unknown error'}`);
        }
    }

    function notifyUser() {
        if (shouldNotify) {
            alert(`[${type.toUpperCase()}] ${typeof error === 'string' ? error : error?.message || 'Unknown error'}`);
        }
    }

    /**
     * Infers the error type based on the error object.
     *
     * @param {string | Error} error - The error to classify.
     * @returns {ErrorType} The inferred error type.
     */
    function inferErrorType(error: string | Error): ErrorType {
        if (typeof error === 'string') {
            return 'error';
        }

        if (error.name === 'ValidationError') {
            return 'validation';
        }
        if (error.name === 'NetworkError' || (error.message && error.message.includes('Network'))) {
            return 'network';
        }
        if (error.name === 'AuthenticationError' || (error.message && error.message.includes('Unauthorized'))) {
            return 'authentication';
        }
        if (error.message && error.message.includes('Component')) {
            return 'component';
        }
        if (error.message && error.message.includes('Runtime')) {
            return 'runtime';
        }

        return 'error';
    }

    /**
     * Converts a technical error message into a user-friendly message.
     *
     * @param {string} message - The technical error message.
     * @returns {string} A user-friendly error message.
     */
    function getUserFriendlyMessage(message: string): string {
        if (message.includes('Network')) {
            return 'There was a problem connecting to the network. Please try again later.';
        }
        if (message.includes('Unauthorized')) {
            return 'You are not authorized to perform this action. Please log in.';
        }
        if (message.includes('Validation')) {
            return 'Some fields contain invalid data. Please review and correct them.';
        }
        if (message.includes('Component')) {
            return 'An error occurred while loading the page. Please refresh the page.';
        }
        if (message.includes('Runtime')) {
            return 'A technical issue occurred. Please try again later.';
        }

        return 'An unexpected error occurred. Please try again.';
    }

    /**
     * Redirects to the error page if the current path is not '/error'.
     *
     * @param {string} message - The error message to pass as a query parameter.
     */
    function redirectToErrorPage(message: string) {
        const userFriendlyMessage = getUserFriendlyMessage(message);

        if (currentPath !== '/error') {
            router.push({
                path: '/error',
                query: { error: userFriendlyMessage }
            }).catch(err => {
                console.error('Error during redirection:', err);
            });
        } else {
            console.error("Error:", userFriendlyMessage);
        }
    }

    logError();
    notifyUser();

    // Ensure message is defined before passing it to redirectToErrorPage
    redirectToErrorPage(typeof error === 'string' ? error : error?.message || 'Unknown error');
}