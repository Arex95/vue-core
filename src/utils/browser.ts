/**
 * Opens a new window with the specified URL and options.
 * @param {string} url The URL to open.
 * @param {Object} [opt] Options for the new window.
 * @param {string} [opt.target='__blank'] The target window name.
 * @param {boolean} [opt.noopener=true] Whether to add 'noopener' attribute.
 * @param {boolean} [opt.noreferrer=true] Whether to add 'noreferrer' attribute.
 */
export function openWindow(
    url: string,
    opt?: { target?: string; noopener?: boolean; noreferrer?: boolean }
): void {
    const { target = '__blank', noopener = true, noreferrer = true } = opt || {};
    const features: string[] = [];

    // Append noopener and noreferrer attributes if enabled
    if (noopener) features.push('noopener=yes');
    if (noreferrer) features.push('noreferrer=yes');

    // Open the window with the specified features
    window.open(url, target, features.join(','));
}

/**
 * Copies text to the clipboard.
 * @param {string} text The text to copy.
 * @returns {Promise<void>} A promise that resolves when the text has been copied.
 */
export async function copyToClipboard(text: string): Promise<void> {
    if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
    } else {
        // Fallback for browsers that do not support the Clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    }
}

/**
 * Scrolls the window to the top smoothly.
 * @param {number} [duration=300] Duration of the scroll animation in milliseconds.
 */
export function scrollToTop(duration: number = 300): void {
    const start = window.scrollY;
    const startTime = performance.now();

    function scroll() {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        window.scrollTo(0, start * (1 - progress));

        if (progress < 1) {
            requestAnimationFrame(scroll);
        }
    }

    requestAnimationFrame(scroll);
}

/**
 * Gets the value of a query parameter from the URL.
 * @param {string} paramName The name of the query parameter.
 * @returns {string | null} The value of the query parameter, or null if it does not exist.
 */
export function getQueryParam(paramName: string): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(paramName);
}