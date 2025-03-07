import { computed } from "vue";

/**
 * Custom composable for sorting products based on a selected criterion.
 * @param {Array} items - The array of products to sort.
 * @param {Array} criteriaList - The list of available sorting criteria.
 * @param {Number} selectedCriteria - The currently selected sorting criterion.
 * @returns {ComputedRef<Array>} - The sorted array of products.
 */
export function useSorter(
    items: any[],
    criteriaList: { value: number, label: string, field: string, order: string, type: string }[],
    selectedCriteria: number
) {
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
        });
    }).value;
}