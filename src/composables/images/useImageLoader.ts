import { useLoaderStore } from '~/core/stores/loader';
/**
 * Composable to manage the loading of images.
 * @param {string[]} imageUrls - List of image URLs to be loaded.
 * @returns {Ref<boolean>} - Reactive reference indicating whether all images have been loaded.
 */
export function useImageLoader(imageUrls: string[]): { allImagesLoaded: Ref<boolean> } {
    const allImagesLoaded = ref(false);
    const loaderStore = useLoaderStore();

    onMounted(() => {
        loaderStore.startLoading();
        const totalImages = imageUrls.length;
        let imagesLoaded = 0;

        imageUrls.forEach((url) => {
            const img = new Image();
            img.src = url;
            img.onload = () => {
                imagesLoaded += 1;
                if (imagesLoaded === totalImages) {
                    allImagesLoaded.value = true;
                    loaderStore.stopLoading();
                }
            };
            img.onerror = () => {
                imagesLoaded += 1;
                if (imagesLoaded === totalImages) {
                    allImagesLoaded.value = true;
                    loaderStore.stopLoading();
                }
            };
        });
    });

    return {
        allImagesLoaded,
    };
}