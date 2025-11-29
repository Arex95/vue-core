/**
 * An event handler that prevents a `KeyboardEvent`'s default action if the key pressed is not a letter or a specific special character.
 *
 * @param {KeyboardEvent} e - The `KeyboardEvent` object.
 * @returns {boolean} `true` if the key is valid, `false` otherwise.
 */
export function validateLetters(e: KeyboardEvent): boolean {
    const key = e.keyCode;
    const validKeys = [
        ...Array.from({ length: 26 }, (_, i) => i + 65), // Letters A-Z
        ...Array.from({ length: 26 }, (_, i) => i + 97), // Letters a-z
        45, // Hyphen
        32, // Space
        241, // ñ
        209, // Ñ
        225, // á
        233, // é
        237, // í
        243, // ó
        250, // ú
        193, // Á
        201, // É
        205, // Í
        211, // Ó
        218 // Ú
    ];
    if (validKeys.includes(key)) {
        return true;
    }

    e.preventDefault();
    return false;
}

// Example usage:
// document.addEventListener('keydown', validateLetters);


/**
 * An event handler that prevents a `KeyboardEvent`'s default action if the key pressed is not an alphanumeric character.
 *
 * @param {KeyboardEvent} e - The `KeyboardEvent` object.
 * @returns {boolean} `true` if the key is valid, `false` otherwise.
 */
export function validateAlphanumeric(e: KeyboardEvent): boolean {
    const key = e.keyCode;
    const validKeys = [
        ...Array.from({ length: 10 }, (_, i) => i + 48), // Numbers 0-9
        ...Array.from({ length: 26 }, (_, i) => i + 65), // Letters A-Z
        ...Array.from({ length: 26 }, (_, i) => i + 97), // Letters a-z
        45, // Hyphen
        95, // Underscore
        32 // Space
    ];
    if (validKeys.includes(key)) {
        return true;
    }

    e.preventDefault();
    return false;
}

// Example usage:
// document.addEventListener('keydown', validateAlphanumeric);


/**
 * An event handler that prevents a `KeyboardEvent`'s default action if the key pressed is not a number.
 *
 * @param {KeyboardEvent} e - The `KeyboardEvent` object.
 * @returns {boolean} `true` if the key is a number, otherwise `false`.
 */
export function validateNumbers(e: KeyboardEvent): boolean {
    const key = e.keyCode;
    if ((key >= 48 && key <= 57) || key === 46 || key === 8 || key === 37 || key === 39) {
        return true;
    }

    e.preventDefault();
    return false;
}

// Example usage:
// document.addEventListener('keydown', validateNumbers);


/**
 * Validates a phone number against a regex for 10-digit numbers.
 *
 * @param {string} phoneNumber - The phone number to validate.
 * @returns {boolean} `true` if the phone number is valid, otherwise `false`.
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
    const phonePattern = /^[0-9]{10}$/; // Example pattern for 10-digit phone numbers
    return phonePattern.test(phoneNumber);
}

// Example usage:
// console.log(isValidPhoneNumber('1234567890')); // true
// console.log(isValidPhoneNumber('123-456-7890')); // false


/**
 * Validates an email address against a standard regex pattern.
 *
 * @param {string} email - The email address to validate.
 * @returns {boolean} `true` if the email is valid, otherwise `false`.
 */
export function isValidEmail(email: string): boolean {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
}

// Example usage:
// console.log(isValidEmail('example@domain.com')); // true
// console.log(isValidEmail('invalid-email')); // false


/**
 * Validates a string to see if it is a well-formed URL.
 *
 * @param {string} url - The URL string to validate.
 * @returns {boolean} `true` if the URL is valid, otherwise `false`.
 */
export function isValidURL(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

// Example usage:
// console.log(isValidURL('https://www.example.com')); // true
// console.log(isValidURL('invalid-url')); // false


/**
 * Validates a string to ensure it is a valid date in 'YYYY-MM-DD' format.
 *
 * @param {string} date - The date string to validate.
 * @returns {boolean} `true` if the date is valid, otherwise `false`.
 */
export function isValidDate(date: string): boolean {
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(date)) return false;

    const [year, month, day] = date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    return dateObj.getFullYear() === year && dateObj.getMonth() === month - 1 && dateObj.getDate() === day;
}

// Example usage:
// console.log(isValidDate('2024-08-31')); // true
// console.log(isValidDate('2024-02-30')); // false


/**
 * Checks if a password meets a set of strength requirements (minimum length, uppercase, lowercase, numbers, special characters).
 *
 * @param {string} password - The password to validate.
 * @returns {boolean} `true` if the password is strong, otherwise `false`.
 */
export function isStrongPassword(password: string): boolean {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChars;
}

// Example usage:
// console.log(isStrongPassword('Strong1@password')); // true
// console.log(isStrongPassword('weakpass')); // false


/**
 * Validates a credit card number using the Luhn algorithm (mod-10 check).
 *
 * @param {string} cardNumber - The credit card number to validate.
 * @returns {boolean} `true` if the credit card number is valid, otherwise `false`.
 */
export function isValidCreditCard(cardNumber: string): boolean {
    const sanitized = cardNumber.replace(/\D/g, '');
    let sum = 0;
    let shouldDouble = false;

    for (let i = sanitized.length - 1; i >= 0; i--) {
        let digit = parseInt(sanitized.charAt(i), 10);

        if (shouldDouble) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }

        sum += digit;
        shouldDouble = !shouldDouble;
    }

    return sum % 10 === 0;
}

// Example usage:
// console.log(isValidCreditCard('4111111111111111')); // true
// console.log(isValidCreditCard('1234567812345670')); // false


/**
 * Validates a string to check if it's a valid 3- or 6-digit hexadecimal color code.
 *
 * @param {string} color - The hex color string to validate.
 * @returns {boolean} `true` if the color code is valid, otherwise `false`.
 */
export function isValidHexColor(color: string): boolean {
    const hexPattern = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/;
    return hexPattern.test(color);
}

// Example usage:
// console.log(isValidHexColor('#FFFFFF')); // true
// console.log(isValidHexColor('#FFF')); // true
// console.log(isValidHexColor('#12345G')); // false


/**
 * Validates a string to ensure it represents a valid time in 24-hour HH:MM format.
 *
 * @param {string} time - The time string to validate.
 * @returns {boolean} `true` if the time is valid, otherwise `false`.
 */
export function isValidTime(time: string): boolean {
    const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return timePattern.test(time);
}

// Example usage:
// console.log(isValidTime('14:30')); // true
// console.log(isValidTime('25:00')); // false


/**
 * Validates a string to check if it is a valid IPv4 address.
 *
 * @param {string} ip - The IP address string to validate.
 * @returns {boolean} `true` if the IP address is valid, otherwise `false`.
 */
export function isValidIP(ip: string): boolean {
    const ipPattern = /^(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)$/;
    return ipPattern.test(ip);
}

// Example usage:
// console.log(isValidIP('192.168.1.1')); // true
// console.log(isValidIP('999.999.999.999')); // false


/**
 * Validates a string to check if it matches the format of a U.S. Social Security Number (SSN).
 *
 * @param {string} ssn - The SSN string to validate.
 * @returns {boolean} `true` if the SSN format is valid, otherwise `false`.
 */
export function isValidSSN(ssn: string): boolean {
    const ssnPattern = /^\d{3}-\d{2}-\d{4}$/;
    return ssnPattern.test(ssn);
}

// Example usage:
// console.log(isValidSSN('123-45-6789')); // true
// console.log(isValidSSN('123-45-678')); // false


/**
 * Validates a string to check if it is a valid 5-digit or 9-digit (ZIP+4) U.S. ZIP code.
 *
 * @param {string} zip - The ZIP code string to validate.
 * @returns {boolean} `true` if the ZIP code is valid, otherwise `false`.
 */
export function isValidZIP(zip: string): boolean {
    const zipPattern = /^\d{5}(-\d{4})?$/;
    return zipPattern.test(zip);
}

// Example usage:
// console.log(isValidZIP('12345')); // true
// console.log(isValidZIP('12345-6789')); // true
// console.log(isValidZIP('1234')); // false


/**
 * Validates a credit card expiry date string (MM/YY format) to ensure it is a valid, non-expired date.
 *
 * @param {string} expiryDate - The expiry date to validate.
 * @returns {boolean} `true` if the expiry date is valid and not in the past, otherwise `false`.
 */
export function isValidExpiryDate(expiryDate: string): boolean {
    const expiryPattern = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (!expiryPattern.test(expiryDate)) return false;

    const [month, year] = expiryDate.split('/').map(Number);
    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;

    return (year > currentYear) || (year === currentYear && month >= currentMonth);
}

// Example usage:
// console.log(isValidExpiryDate('08/24')); // true
// console.log(isValidExpiryDate('12/22')); // false


/**
 * Validates a string to check if it's a valid 8-digit hexadecimal color code (with alpha channel).
 *
 * @param {string} color - The hex color string to validate.
 * @returns {boolean} `true` if the color code is valid, otherwise `false`.
 */
export function isValidHexColorAlpha(color: string): boolean {
    const hexPattern = /^#([0-9A-Fa-f]{8})$/;
    return hexPattern.test(color);
}

// Example usage:
// console.log(isValidHexColorAlpha('#RRGGBBAA')); // true
// console.log(isValidHexColorAlpha('#FFFFFF')); // false


/**
 * Validates a username to ensure it contains only alphanumeric characters and underscores, with a length between 3 and 16 characters.
 *
 * @param {string} username - The username to validate.
 * @returns {boolean} `true` if the username is valid, otherwise `false`.
 */
export function isValidUsername(username: string): boolean {
    const usernamePattern = /^[a-zA-Z0-9_]{3,16}$/; // 3 to 16 characters, letters, numbers, and underscores only
    return usernamePattern.test(username);
}

// Example usage:
// console.log(isValidUsername('user_name123')); // true
// console.log(isValidUsername('us')); // false


/**
 * Validates a string to ensure it represents a plausible human age (0-120).
 *
 * @param {string} age - The age string to validate.
 * @returns {boolean} `true` if the age is valid, otherwise `false`.
 */
export function isValidAge(age: string): boolean {
    const ageNumber = parseInt(age, 10);
    return !isNaN(ageNumber) && ageNumber >= 0 && ageNumber <= 120;
}

// Example usage:
// console.log(isValidAge('25')); // true
// console.log(isValidAge('121')); // false


/**
 * Validates a string to check if it contains only valid hexadecimal characters.
 *
 * @param {string} hex - The string to validate.
 * @returns {boolean} `true` if the string is a valid hexadecimal number, otherwise `false`.
 */
export function isValidHexNumber(hex: string): boolean {
    const hexPattern = /^[0-9A-Fa-f]+$/;
    return hexPattern.test(hex);
}

// Example usage:
// console.log(isValidHexNumber('1A3F')); // true
// console.log(isValidHexNumber('GHIJ')); // false