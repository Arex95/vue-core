/**
 * A composable function that filters objects based on a specific field and criteria.
 *
 * @param {Object[]} items - The list of objects to filter.
 * @param {Object} filterConfig - Configuration for the filter, specifying the field, the data type to filter, and the criteria.
 * @param {string} filterConfig.field - The field in the objects to filter.
 * @param {string} filterConfig.type - The data type of the field ('date', 'string', 'number', 'boolean').
 * @param {any} filterConfig.criteria - The criteria for filtering. Can be a date range, a string to search, a number range, or a boolean value.
 *
 * @returns {Object[]} - The filtered list of objects.
 */
export default function useFilter<T extends Record<string, any>>(
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