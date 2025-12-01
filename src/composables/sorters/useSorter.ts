import { computed, ComputedRef } from "vue";

/**
 * A composable that sorts an array of objects based on a selected criterion from a list of predefined sorting options.
 * It supports sorting by number, date, boolean, and string fields, in both ascending and descending order.
 *
 * @template T The type of items in the array.
 * @param {T[]} items - The array of objects to sort.
 * @param {Array<{value: number, label: string, field: string, order: string, type: string}>} criteriaList - A list of
 *   sorting criteria objects. Each object defines a sorting option with a unique `value`, a `label` for display, the `field`
 *   to sort by, the `order` ('asc' or 'desc'), and the data `type` ('number', 'date', 'boolean', 'string').
 * @param {number} selectedCriteria - The `value` of the currently selected sorting criterion from the `criteriaList`.
 * @returns {ComputedRef<T[]>} A computed ref containing the sorted items. If the selected criterion is not found, the original array is returned.
 */
export function useSorter<T extends Record<string, any>>(
    items: T[],
    criteriaList: { value: number, label: string, field: string, order: string, type: string }[],
    selectedCriteria: number
): ComputedRef<T[]> {
    return computed(() => {
        const criteria = criteriaList.find(item => item.value === Number(selectedCriteria));
        if (!criteria) return items;

        return [...items].sort((a, b) => {
            const aValue = a[criteria.field];
            const bValue = b[criteria.field];

            if (criteria.type === 'number') {
                const numA = typeof aValue === 'number' ? aValue : parseFloat(aValue) || 0;
                const numB = typeof bValue === 'number' ? bValue : parseFloat(bValue) || 0;
                return criteria.order === 'asc' ? numA - numB : numB - numA;

            } else if (criteria.type === 'date') {
                const dateA = new Date(aValue).getTime();
                const dateB = new Date(bValue).getTime();
                return criteria.order === 'asc' ? dateA - dateB : dateB - dateA;

            } else if (criteria.type === 'boolean') {
                const boolA = !!aValue;
                const boolB = !!bValue;
                return criteria.order === 'asc' ? (boolA === boolB ? 0 : boolA ? 1 : -1) : (boolA === boolB ? 0 : boolA ? -1 : 1);

            } else {
                // Fallback for string sorting
                const strA = (aValue || '').toString().toLowerCase();
                const strB = (bValue || '').toString().toLowerCase();
                return criteria.order === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
            }
        }) as T[];
    });
}