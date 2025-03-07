import { computed, Ref } from "vue";

/**
 * Composable to handle pagination logic.
 *
 * @param page - Reactive ref for the current page number.
 * @param total - Reactive ref for total number of items.
 * @param pageSize - Reactive ref for number of items per page.
 * @returns An object with pagination controls.
 */
export default function usePagination(page: Ref<number>, total: Ref<number>, pageSize: Ref<number>) {
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