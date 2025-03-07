import axiosService from '~/core/config/axios/axiosConfig';

/**
 * Composable for tracking and managing active Axios requests.
 *
 * @returns {Object} An object containing the reactive state and methods for managing active requests.
 */
export function useActiveRequest() {
    const activeRequests = ref(0);

    /**
     * Increments the count of active requests.
     */
    function increment() {
        activeRequests.value += 1;
    }

    /**
     * Decrements the count of active requests.
     */
    function decrement() {
        activeRequests.value -= 1;
    }

    /**
     * Starts tracking active requests by setting up interceptors.
     */
    function startTracking() {
        axiosService.interceptors.request.use(
            (config) => {
                increment();
                return config;
            },
            (error) => {
                decrement();
                return Promise.reject(error);
            }
        );

        axiosService.interceptors.response.use(
            (response) => {
                decrement();
                return response;
            },
            (error) => {
                decrement();
                return Promise.reject(error);
            }
        );
    }

    /**
     * Stops tracking active requests by removing interceptors.
     */
    function stopTracking() {
        // Clean up interceptors if needed
    }

    // Start tracking requests on composable setup
    startTracking();

    // Clean up interceptors when composable is unmounted
    onUnmounted(() => {
        stopTracking();
    });

    return {
        activeRequests,
    };
}