/**
 * Opens a new browser window or tab with a specified URL, providing options for the target and security attributes.
 *
 * @param {string} url - The URL to open in the new window.
 * @param {object} [opt] - Optional configuration for the new window.
 * @param {string} [opt.target='_blank'] - The target attribute for the link, specifying where to open the content (e.g., '_blank', '_self').
 * @param {boolean} [opt.noopener=true] - If `true`, adds `noopener` to the window features to prevent the new window from accessing the original window's object.
 * @param {boolean} [opt.noreferrer=true] - If `true`, adds `noreferrer` to prevent the browser from sending the `Referer` HTTP header.
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
 * Asynchronously copies a given string to the user's clipboard. It uses the modern `navigator.clipboard` API
 * with a fallback to the deprecated `document.execCommand` for older browsers.
 *
 * @param {string} text - The string to be copied to the clipboard.
 * @returns {Promise<void>} A promise that resolves when the text has been successfully copied.
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
 * Smoothly scrolls the window to the top of the page using a `requestAnimationFrame` loop
 * for a fluid animation.
 *
 * @param {number} [duration=300] - The total duration of the scroll animation in milliseconds.
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
 * Retrieves the value of a specified query parameter from the current URL's search string.
 *
 * @param {string} paramName - The name of the query parameter to retrieve.
 * @returns {string | null} The value of the query parameter, or `null` if the parameter is not present in the URL.
 */
export function getQueryParam(paramName: string): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(paramName);
}