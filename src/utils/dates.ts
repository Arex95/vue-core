/**
 * Parses a date string into a Date object.
 * @param {string} dateString The date string in 'YYYY-MM-DD' format.
 * @returns {Date | null} The parsed Date object or null if the format is invalid.
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
 * Formats a Date object into a string.
 * @param {Date} date The date to format.
 * @param {string} format The format string (e.g., 'YYYY-MM-DD').
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
 * Calculates the number of days between two dates.
 * @param {Date} startDate The start date.
 * @param {Date} endDate The end date.
 * @returns {number} The number of days between the two dates.
 */
export function daysBetween(startDate: Date, endDate: Date): number {
    const millisecondsPerDay = 86400000; // Number of milliseconds in one day
    return Math.round((endDate.getTime() - startDate.getTime()) / millisecondsPerDay);
}

/**
 * Adds a specified number of days to a date.
 * @param {Date} date The date to modify.
 * @param {number} days The number of days to add.
 * @returns {Date} The new date with days added.
 */
export function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

/**
 * Subtracts a specified number of days from a date.
 * @param {Date} date The date to modify.
 * @param {number} days The number of days to subtract.
 * @returns {Date} The new date with days subtracted.
 */
export function subtractDays(date: Date, days: number): Date {
    return addDays(date, -days);
}

/**
 * Determines if a year is a leap year.
 * @param {number} year The year to check.
 * @returns {boolean} True if the year is a leap year, false otherwise.
 */
export function isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

/**
 * Gets the first day of the month for a given date.
 * @param {Date} date The date to use.
 * @returns {Date} The first day of the month.
 */
export function getStartOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Gets the last day of the month for a given date.
 * @param {Date} date The date to use.
 * @returns {Date} The last day of the month.
 */
export function getEndOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/**
 * Calculates age from a given birth date.
 * @param {Date} birthDate The birth date.
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
 * Calculates the number of days until the next birthday.
 * @param {Date} birthDate The birth date.
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
 * Calculates the age at a specific date.
 * @param {Date} birthDate The birth date.
 * @param {Date} atDate The date to calculate the age at.
 * @returns {number} The calculated age.
 */
export function ageAtDate(birthDate: Date, atDate: Date): number {
    let age = atDate.getFullYear() - birthDate.getFullYear();
    const m = atDate.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && atDate.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}