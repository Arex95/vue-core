import { computed } from "vue";

/**
 * A composable function that filters an array of objects based on a specified field, data type, and criteria.
 * It supports filtering by date range, string matching (case-insensitive and diacritic-insensitive), number range, and boolean values.
 *
 * @template T A generic type that extends a record of string keys to any value, representing the objects in the array.
 * @param {T[]} items - The array of objects to be filtered.
 * @param {object} filterConfig - The configuration object for filtering.
 * @param {string} filterConfig.field - The name of the field in the objects to filter by.
 * @param {'date' | 'string' | 'number' | 'boolean'} filterConfig.type - The data type of the field to be filtered.
 * @param {any} filterConfig.criteria - The criteria for filtering, which varies based on the `type`:
 *   - For 'date': An object `{ startDate: string, endDate: string }`.
 *   - For 'string': A string to search for.
 *   - For 'number': An object `{ min: number, max: number }`.
 *   - For 'boolean': A boolean value.
 * @returns {T[]} The filtered array of objects. If the criteria are invalid or not provided, the original array is returned.
 */
export function useFilter<T extends Record<string, any>>(
    items: T[],
    filterConfig: {
        field: string;
        type: 'date' | 'string' | 'number' | 'boolean';
        criteria: any;
    }
): T[] {
    // Ensure the filterConfig is correctly structured
    const { field, type, criteria } = filterConfig;

    // Define the filter functions
    const filterByDate = (objects: T[], field: string, { startDate, endDate }: { startDate: string; endDate: string }) =>
        objects.filter(item => {
            const date = new Date(item[field]);
            return date >= new Date(startDate) && date <= new Date(endDate);
        });

    const filterByString = (objects: T[], field: string, searchTerm: string) => {
        const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        const words = normalize(searchTerm).split(/\s+/).filter(Boolean);

        return objects.filter(item => {
            const normalizedFieldValue = normalize(item[field]);
            return words.every(word => normalizedFieldValue.includes(word));
        });
    };

    const filterByNumber = (objects: T[], field: string, { min, max }: { min: number; max: number }) =>
        objects.filter(item => {
            const value = item[field];
            return value >= min && value <= max;
        });

    const filterByBoolean = (objects: T[], field: string, expectedValue: boolean) =>
        objects.filter(item => item[field] === expectedValue);

    // Apply the appropriate filter and return the filtered objects
    const filteredObjects = computed(() => {
        if (!criteria ||
            (type === 'date' && (!criteria.startDate || !criteria.endDate)) ||
            (type === 'number' && (criteria.min == null || criteria.max == null)) ||
            (type === 'boolean' && typeof criteria !== 'boolean')) {
            return items; // Return all objects if criteria is not valid
        }

        // Apply the filter based on the type
        switch (type) {
            case 'date':
                return filterByDate(items, field, criteria);
            case 'string':
                return filterByString(items, field, criteria);
            case 'number':
                return filterByNumber(items, field, criteria);
            case 'boolean':
                return filterByBoolean(items, field, criteria);
            default:
                return items;
        }
    });

    return filteredObjects.value;
}