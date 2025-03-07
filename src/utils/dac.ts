import { defineAsyncComponent } from 'vue';

/**
 * Lazy loads a component with optional loading options.
 * @param path - The path to the component.
 * @param options - Additional options for loading.
 * @returns {Promise<typeof import('*.vue').default>}
 */
export const lazyLoad = (path: string, options?: {
    loadingComponent?: () => Promise<typeof import('*.vue').default>;
    delay?: number;
    timeout?: number;
}) => {
    return defineAsyncComponent({
        loader: () => import(path),
        loadingComponent: options?.loadingComponent,
        delay: options?.delay || 200,
        timeout: options?.timeout || 3000,
    });
};