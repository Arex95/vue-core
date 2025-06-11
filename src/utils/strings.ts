/**
 * Capitalizes the first character of a string.
 * @param {string} s The string to capitalize.
 * @returns {string} The capitalized string.
 */
export function upperFirst(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

// Example usage:
// console.log(upperFirst('hello')); // 'Hello'

/**
 * Lowercases the first character of a string.
 * @param {string} s The string to lowercase.
 * @returns {string} The lowercased string.
 */
export function lowerFirst(s: string): string {
    return s.charAt(0).toLowerCase() + s.slice(1);
}

// Example usage:
// console.log(lowerFirst('Hello')); // 'hello'

/**
 * Removes accents and special characters from a string and converts it to a URL-friendly format.
 * @param {string} input The string to process.
 * @returns {string} The processed string.
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
 * Reverses a string.
 * @param {string} str The string to reverse.
 * @returns {string} The reversed string.
 */
export function reverseString(str: string): string {
    return str.split('').reverse().join('');
}

// Example usage:
// console.log(reverseString('hello')); // 'olleh'

/**
 * Counts the number of words in a string.
 * @param {string} str The string to analyze.
 * @returns {number} The word count.
 */
export function countWords(str: string): number {
    return str.trim().split(/\s+/).length;
}

// Example usage:
// console.log(countWords('Hello world!')); // 2

/**
 * Truncates a string to the specified length and adds ellipsis if necessary.
 * @param {string} str The string to truncate.
 * @param {number} maxLength The maximum length of the string.
 * @returns {string} The truncated string.
 */
export function truncateString(str: string, maxLength: number): string {
    return str.length > maxLength ? str.slice(0, maxLength) + '...' : str;
}

// Example usage:
// console.log(truncateString('This is a long string', 10)); // 'This is a...'

/**
 * Converts a string to camel case.
 * @param {string} str The string to convert.
 * @returns {string} The camel cased string.
 */
export function toCamelCase(str: string): string {
    return str
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+(.)/g, (match, chr) => chr.toUpperCase());
}

// Example usage:
// console.log(toCamelCase('hello world example')); // 'helloWorldExample'

/**
 * Converts a string to kebab case.
 * @param {string} str The string to convert.
 * @returns {string} The kebab cased string.
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
 * Replaces all instances of a substring within a string.
 * @param {string} str The original string.
 * @param {string} find The substring to find.
 * @param {string} replace The substring to replace with.
 * @returns {string} The modified string.
 */
export function replaceAll(str: string, find: string, replace: string): string {
    return str.split(find).join(replace);
}

// Example usage:
// console.log(replaceAll('hello world', 'o', 'a')); // 'hella warld'

/**
 * Generates a random string of a specific length.
 * @param {number} length The length of the string to generate.
 * @returns {string} The random string.
 */
export function generateRandomString(length: number): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length }, () => characters.charAt(Math.floor(Math.random() * characters.length))).join('');
}

// Example usage:
// console.log(generateRandomString(10)); // 'A1b2C3d4E5'