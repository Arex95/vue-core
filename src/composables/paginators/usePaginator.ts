import { computed, Ref } from "vue";

/**
 * A composable that provides pagination logic based on reactive refs for the current page,
 * total number of items, and items per page.
 *
 * @param {Ref<number>} page - A reactive ref representing the current page number.
 * @param {Ref<number>} total - A reactive ref representing the total number of items to be paginated.
 * @param {Ref<number>} pageSize - A reactive ref representing the number of items per page.
 * @returns {{
 *   totalPages: import('vue').ComputedRef<number>,
 *   canFetchNextPage: () => boolean,
 *   canFetchPreviousPage: () => boolean
 * }} An object containing:
 *   - `totalPages`: A computed property that calculates the total number of pages.
 *   - `canFetchNextPage`: A function that returns `true` if there is a next page.
 *   - `canFetchPreviousPage`: A function that returns `true` if there is a previous page.
 */
export function usePagination(page: Ref<number>, total: Ref<number>, pageSize: Ref<number>) {
    // Calculate the total number of pages
    const totalPages = computed(() => Math.ceil(total.value / pageSize.value));

    // Determine if the next page can be fetched
    const canFetchNextPage = (): boolean => page.value < totalPages.value;

    // Determine if the previous page can be fetched
    const canFetchPreviousPage = (): boolean => page.value > 1;

    return {
        totalPages,
        canFetchNextPage,
        canFetchPreviousPage
    };
}