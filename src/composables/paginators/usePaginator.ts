/**
 * Composable to handle pagination logic.
 *
 * @param page
 * @param total - Reactive ref for total number of items.
 * @param pageSize - Number of items per page.
 * @returns An object with pagination controls.
 */
export default function usePagination(page: Ref<number>, total: Ref<number>, pageSize: Ref<number>) {
    const totalPages = computed(() => Math.ceil(total.value / pageSize.value));
    const canFetchNextPage = () => page.value < totalPages.value;

    return {
        totalPages,
        canFetchNextPage
    };
}