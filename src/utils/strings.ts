/**
 * Capitalizes the first letter of a string.
 *
 * @param {string} s - The input string.
 * @returns {string} The string with the first letter capitalized.
 */
export function upperFirst(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

// Example usage:
// console.log(upperFirst('hello')); // 'Hello'

/**
 * Converts the first letter of a string to lowercase.
 *
 * @param {string} s - The input string.
 * @returns {string} The string with the first letter in lowercase.
 */
export function lowerFirst(s: string): string {
    return s.charAt(0).toLowerCase() + s.slice(1);
}

// Example usage:
// console.log(lowerFirst('Hello')); // 'hello'

/**
 * Normalizes a string by converting it to lowercase, trimming whitespace, replacing spaces with hyphens,
 * and removing diacritical marks (accents).
 *
 * @param {string} input - The string to normalize.
 * @returns {string} The URL-friendly, normalized string.
 */
export function removeAccent(input: string): string {
    return input
        .toLowerCase()
        .trim()
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

// Example usage:
// console.log(removeAccent('Café du Nord')); // 'cafe-du-nord'

/**
 * Reverses the characters of a string.
 *
 * @param {string} str - The input string.
 * @returns {string} The reversed string.
 */
export function reverseString(str: string): string {
    return str.split('').reverse().join('');
}

// Example usage:
// console.log(reverseString('hello')); // 'olleh'

/**
 * Counts the number of words in a string, based on whitespace separation.
 *
 * @param {string} str - The input string.
 * @returns {number} The number of words in the string.
 */
export function countWords(str: string): number {
    return str.trim().split(/\s+/).length;
}

// Example usage:
// console.log(countWords('Hello world!')); // 2

/**
 * Truncates a string to a specified maximum length, appending '...' if the string is cut.
 *
 * @param {string} str - The input string.
 * @param {number} maxLength - The maximum desired length of the string.
 * @returns {string} The truncated string.
 */
export function truncateString(str: string, maxLength: number): string {
    return str.length > maxLength ? str.slice(0, maxLength) + '...' : str;
}

// Example usage:
// console.log(truncateString('This is a long string', 10)); // 'This is a...'

/**
 * Converts a string from various cases (e.g., snake_case, kebab-case, space separated) into camelCase.
 *
 * @param {string} str - The input string.
 * @returns {string} The camelCase version of the string.
 */
export function toCamelCase(str: string): string {
    return str
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+(.)/g, (match, chr) => chr.toUpperCase());
}

// Example usage:
// console.log(toCamelCase('hello world example')); // 'helloWorldExample'

/**
 * Converts a string from various cases (e.g., camelCase, PascalCase, space separated) into kebab-case.
 *
 * @param {string} str - The input string.
 * @returns {string} The kebab-case version of the string.
 */
export function toKebabCase(str: string): string {
    return str
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/[\s_]+/g, '-')
        .toLowerCase();
}

// Example usage:
// console.log(toKebabCase('Hello World Example')); // 'hello-world-example'

/**
 * Replaces all occurrences of a substring with a new substring.
 *
 * @param {string} str - The original string.
 * @param {string} find - The substring to find and replace.
 * @param {string} replace - The substring to replace with.
 * @returns {string} A new string with all replacements made.
 */
export function replaceAll(str: string, find: string, replace: string): string {
    return str.split(find).join(replace);
}

// Example usage:
// console.log(replaceAll('hello world', 'o', 'a')); // 'hella warld'

/**
 * Generates a random alphanumeric string of a specified length.
 *
 * @param {number} length - The desired length of the random string.
 * @returns {string} The generated random string.
 */
export function generateRandomString(length: number): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length }, () => characters.charAt(Math.floor(Math.random() * characters.length))).join('');
}

// Example usage:
// console.log(generateRandomString(10)); // 'A1b2C3d4E5'