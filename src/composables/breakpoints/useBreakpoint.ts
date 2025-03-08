import { breakpointsTailwind, useBreakpoints, useWindowSize } from '@vueuse/core';
import { ref, watch } from 'vue';

let notified = false;
/**
 * Composable to manage breakpoints using Tailwind CSS and shared window resize listener.
 *
 * @returns {Object} An object containing the breakpoints and their states.
 */
export function useBreakpoint() {
    const breakpoints = useBreakpoints(breakpointsTailwind);

    const current = breakpoints.current();
    const active = breakpoints.active();

    // Define breakpoints
    const sm_S = breakpoints.smaller('sm');
    const sm_SE = breakpoints.smallerOrEqual('sm');
    const sm_GE = breakpoints.greaterOrEqual('sm');
    const sm_md = breakpoints.between('sm', 'md');
    const sm_xl = breakpoints.between('sm', 'xl');
    const sm_2xl = breakpoints.between('sm', '2xl');

    const md_S = breakpoints.smaller('md');
    const md_SE = breakpoints.smallerOrEqual('md');
    const md_GE = breakpoints.greaterOrEqual('md');
    const md_lg = breakpoints.between('md', 'lg');
    const md_xl = breakpoints.between('md', 'xl');
    const md_2xl = breakpoints.between('md', '2xl');

    const lg_S = breakpoints.smaller('lg');
    const lg_SE = breakpoints.smallerOrEqual('lg');
    const lg_GE = breakpoints.greaterOrEqual('lg');
    const lg_xl = breakpoints.between('lg', 'xl');
    const lg_2xl = breakpoints.between('lg', '2xl');

    const xl_S = breakpoints.smaller('xl');
    const xl_SE = breakpoints.smallerOrEqual('xl');
    const xl_GE = breakpoints.greaterOrEqual('xl');
    const xl_2xl = breakpoints.between('xl', '2xl');

    const _2xl_S = breakpoints.smaller('2xl');
    const _2xl_SE = breakpoints.smallerOrEqual('2xl');
    const _2xl_GE = breakpoints.greaterOrEqual('2xl');

    const reactiveBreakpoint = ref<keyof typeof breakpointsTailwind>('sm');
    const isGreaterThanBreakpoint = breakpoints.greaterOrEqual(() => reactiveBreakpoint.value);

    // Define device ranges
    const mobile = breakpoints.smaller('md'); // <768px
    const tablet = breakpoints.between('md', 'lg'); // 768px - 1024px
    const laptop = breakpoints.between('lg', 'xl'); // 1024px - 1280px
    const desktop = breakpoints.greaterOrEqual('xl'); // >=1280px

    // Use VueUse for window size
    const { width: windowWidth, height: windowHeight } = useWindowSize();

    /**
     * Logs a styled "chip" message to the console.
     *
     * @param {string} label - The label to display inside the chip.
     * @param {string} backgroundColor - The background color of the chip.
     * @param {string} textColor - The text color of the chip.
     */
    const logChip = (label: string, backgroundColor: string, textColor: string = 'white') => {
        console.log(
            `%c ${label} `,
            `background-color: ${backgroundColor}; color: ${textColor}; border-radius: 16px; padding: 4px 8px;`
        );
    };

    // Singleton logic: Only notify once
    const notifyOnce = () => {
        if (notified) return;

        watch([mobile, tablet, laptop, desktop], ([isMobile, isTablet, isLaptop, isDesktop]) => {
            if (isMobile) {
                logChip('Mobile', '#ff6b6b');
            } else if (isTablet) {
                logChip('Tablet', '#4ecdc4');
            } else if (isLaptop) {
                logChip('Laptop', '#1a535c');
            } else if (isDesktop) {
                logChip('Desktop', '#f7fff7', 'black');
            }
            notified = true;  // Mark as notified
        }, { immediate: true });
    };

    notifyOnce();  // Ensure the notification happens only once globally

    return {
        current,
        active,
        sm_S,
        sm_SE,
        sm_GE,
        sm_md,
        sm_xl,
        sm_2xl,
        md_S,
        md_SE,
        md_GE,
        md_lg,
        md_xl,
        md_2xl,
        lg_S,
        lg_SE,
        lg_GE,
        lg_xl,
        lg_2xl,
        xl_S,
        xl_SE,
        xl_GE,
        xl_2xl,
        _2xl_S,
        _2xl_SE,
        _2xl_GE,
        isGreaterThanBreakpoint,
        reactiveBreakpoint,
        breakpointsTailwind,
        windowWidth,
        windowHeight,
        mobile,
        tablet,
        laptop,
        desktop,
        breakpoints,
    };
}