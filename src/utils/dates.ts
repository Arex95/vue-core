/**
 * Parses a date string in the format 'YYYY-MM-DD' and returns a `Date` object.
 * It includes validation to ensure the parsed date is a valid calendar date.
 *
 * @param {string} dateString - The date string to parse.
 * @returns {Date | null} A `Date` object if the string is a valid date, otherwise `null`.
 */
export function parseDate(dateString: string): Date | null {
    const parts = dateString.split('-');
    if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Months are zero-based
        const day = parseInt(parts[2], 10);
        const date = new Date(year, month, day);
        if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
            return date;
        }
    }
    return null;
}

/**
 * Formats a `Date` object into a custom string format.
 * Supported format specifiers: YYYY, MM, DD, HH, mm, ss.
 *
 * @param {Date} date - The `Date` object to format.
 * @param {string} format - The desired string format (e.g., 'YYYY-MM-DD HH:mm:ss').
 * @returns {string} The formatted date string.
 */
export function formatDate(date: Date, format: string): string {
    const map: { [key: string]: number | string } = {
        'YYYY': date.getFullYear(),
        'MM': String(date.getMonth() + 1).padStart(2, '0'),
        'DD': String(date.getDate()).padStart(2, '0'),
        'HH': String(date.getHours()).padStart(2, '0'),
        'mm': String(date.getMinutes()).padStart(2, '0'),
        'ss': String(date.getSeconds()).padStart(2, '0')
    };

    return format.replace(/YYYY|MM|DD|HH|mm|ss/g, (matched) => (map[matched] || matched).toString());
}

/**
 * Calculates the total number of full days between two dates.
 *
 * @param {Date} startDate - The starting date.
 * @param {Date} endDate - The ending date.
 * @returns {number} The number of days between the two dates.
 */
export function daysBetween(startDate: Date, endDate: Date): number {
    const millisecondsPerDay = 86400000; // Number of milliseconds in one day
    return Math.round((endDate.getTime() - startDate.getTime()) / millisecondsPerDay);
}

/**
 * Adds a specified number of days to a given date.
 *
 * @param {Date} date - The original date.
 * @param {number} days - The number of days to add (can be negative to subtract).
 * @returns {Date} A new `Date` object representing the resulting date.
 */
export function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

/**
 * Subtracts a specified number of days from a given date.
 *
 * @param {Date} date - The original date.
 * @param {number} days - The number of days to subtract.
 * @returns {Date} A new `Date` object representing the resulting date.
 */
export function subtractDays(date: Date, days: number): Date {
    return addDays(date, -days);
}

/**
 * Determines whether a given year is a leap year according to the Gregorian calendar rules.
 *
 * @param {number} year - The year to check.
 * @returns {boolean} `true` if the year is a leap year, otherwise `false`.
 */
export function isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

/**
 * Returns a new `Date` object set to the first day of the month for a given date.
 *
 * @param {Date} date - The date from which to determine the month and year.
 * @returns {Date} A `Date` object representing the start of the month.
 */
export function getStartOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Returns a new `Date` object set to the last day of the month for a given date.
 *
 * @param {Date} date - The date from which to determine the month and year.
 * @returns {Date} A `Date` object representing the end of the month.
 */
export function getEndOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/**
 * Calculates the current age in years based on a given birth date.
 *
 * @param {Date} birthDate - The date of birth.
 * @returns {number} The calculated age.
 */
export function calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

/**
 * Calculates the number of days from the current date until the next birthday.
 *
 * @param {Date} birthDate - The date of birth.
 * @returns {number} The number of days until the next birthday.
 */
export function daysToNextBirthday(birthDate: Date): number {
    const today = new Date();
    const currentYear = today.getFullYear();
    const nextBirthday = new Date(birthDate);
    nextBirthday.setFullYear(currentYear);

    if (nextBirthday < today) {
        nextBirthday.setFullYear(currentYear + 1);
    }

    return daysBetween(today, nextBirthday);
}

/**
 * Calculates the age of a person on a specific date in the past or future.
 *
 * @param {Date} birthDate - The date of birth.
 * @param {Date} atDate - The target date for which to calculate the age.
 * @returns {number} The age on the specified date.
 */
export function ageAtDate(birthDate: Date, atDate: Date): number {
    let age = atDate.getFullYear() - birthDate.getFullYear();
    const m = atDate.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && atDate.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}