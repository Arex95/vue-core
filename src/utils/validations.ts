/**
 * Validates if the key pressed is a valid letter or special character.
 * @param {KeyboardEvent} e The keyboard event.
 * @returns {boolean} True if the key is valid, otherwise false.
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
 * Validates if the key pressed is a valid alphanumeric character.
 * @param {KeyboardEvent} e The keyboard event.
 * @returns {boolean} True if the key is valid, otherwise false.
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
 * Validates if the key pressed is a number.
 * @param {KeyboardEvent} e The keyboard event.
 * @returns {boolean} True if the key is a number, otherwise false.
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
 * Validates if a phone number is valid.
 * @param {string} phoneNumber The phone number to validate.
 * @returns {boolean} True if the phone number is valid, otherwise false.
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
    const phonePattern = /^[0-9]{10}$/; // Example pattern for 10-digit phone numbers
    return phonePattern.test(phoneNumber);
}

// Example usage:
// console.log(isValidPhoneNumber('1234567890')); // true
// console.log(isValidPhoneNumber('123-456-7890')); // false


/**
 * Validates if a string is a valid email address.
 * @param {string} email The email address to validate.
 * @returns {boolean} True if the email address is valid, otherwise false.
 */
export function isValidEmail(email: string): boolean {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
}

// Example usage:
// console.log(isValidEmail('example@domain.com')); // true
// console.log(isValidEmail('invalid-email')); // false


/**
 * Validates if a string is a valid URL.
 * @param {string} url The URL to validate.
 * @returns {boolean} True if the URL is valid, otherwise false.
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
 * Validates if a string is a valid date in YYYY-MM-DD format.
 * @param {string} date The date string to validate.
 * @returns {boolean} True if the date is valid, otherwise false.
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
 * Validates if a password meets certain strength criteria.
 * @param {string} password The password to validate.
 * @returns {boolean} True if the password is strong, otherwise false.
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
 * Validates a credit card number using the Luhn algorithm.
 * @param {string} cardNumber The credit card number to validate.
 * @returns {boolean} True if the credit card number is valid, otherwise false.
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
 * Validates if a string is a valid hex color code.
 * @param {string} color The color code to validate.
 * @returns {boolean} True if the color code is valid, otherwise false.
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
 * Validates if a string is a valid time in HH:MM format.
 * @param {string} time The time string to validate.
 * @returns {boolean} True if the time is valid, otherwise false.
 */
export function isValidTime(time: string): boolean {
    const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return timePattern.test(time);
}

// Example usage:
// console.log(isValidTime('14:30')); // true
// console.log(isValidTime('25:00')); // false


/**
 * Validates if a string is a valid IPv4 address.
 * @param {string} ip The IP address to validate.
 * @returns {boolean} True if the IP address is valid, otherwise false.
 */
export function isValidIP(ip: string): boolean {
    const ipPattern = /^(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)$/;
    return ipPattern.test(ip);
}

// Example usage:
// console.log(isValidIP('192.168.1.1')); // true
// console.log(isValidIP('999.999.999.999')); // false


/**
 * Validates if a string is a valid U.S. Social Security Number (SSN).
 * @param {string} ssn The SSN to validate.
 * @returns {boolean} True if the SSN is valid, otherwise false.
 */
export function isValidSSN(ssn: string): boolean {
    const ssnPattern = /^\d{3}-\d{2}-\d{4}$/;
    return ssnPattern.test(ssn);
}

// Example usage:
// console.log(isValidSSN('123-45-6789')); // true
// console.log(isValidSSN('123-45-678')); // false


/**
 * Validates if a string is a valid U.S. ZIP code.
 * @param {string} zip The ZIP code to validate.
 * @returns {boolean} True if the ZIP code is valid, otherwise false.
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
 * Validates if a string is a valid credit card expiry date in MM/YY format.
 * @param {string} expiryDate The expiry date to validate.
 * @returns {boolean} True if the expiry date is valid, otherwise false.
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
 * Validates if a string is a valid 8-character hexadecimal color code (including alpha).
 * @param {string} color The color code to validate.
 * @returns {boolean} True if the color code is valid, otherwise false.
 */
export function isValidHexColorAlpha(color: string): boolean {
    const hexPattern = /^#([0-9A-Fa-f]{8})$/;
    return hexPattern.test(color);
}

// Example usage:
// console.log(isValidHexColorAlpha('#RRGGBBAA')); // true
// console.log(isValidHexColorAlpha('#FFFFFF')); // false


/**
 * Validates if a username meets specific criteria.
 * @param {string} username The username to validate.
 * @returns {boolean} True if the username is valid, otherwise false.
 */
export function isValidUsername(username: string): boolean {
    const usernamePattern = /^[a-zA-Z0-9_]{3,16}$/; // 3 to 16 characters, letters, numbers, and underscores only
    return usernamePattern.test(username);
}

// Example usage:
// console.log(isValidUsername('user_name123')); // true
// console.log(isValidUsername('us')); // false


/**
 * Validates if a string represents a valid age between 0 and 120.
 * @param {string} age The age to validate.
 * @returns {boolean} True if the age is valid, otherwise false.
 */
export function isValidAge(age: string): boolean {
    const ageNumber = parseInt(age, 10);
    return !isNaN(ageNumber) && ageNumber >= 0 && ageNumber <= 120;
}

// Example usage:
// console.log(isValidAge('25')); // true
// console.log(isValidAge('121')); // false


/**
 * Validates if a string is a valid hexadecimal number.
 * @param {string} hex The hexadecimal number to validate.
 * @returns {boolean} True if the number is valid, otherwise false.
 */
export function isValidHexNumber(hex: string): boolean {
    const hexPattern = /^[0-9A-Fa-f]+$/;
    return hexPattern.test(hex);
}

// Example usage:
// console.log(isValidHexNumber('1A3F')); // true
// console.log(isValidHexNumber('GHIJ')); // false