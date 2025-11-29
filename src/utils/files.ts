/**
 * Converts a `FormData` object into a regular JavaScript object. It correctly handles
 * multiple values for the same key by creating an array for that key.
 *
 * @param {FormData} formData - The `FormData` object to convert.
 * @returns {Record<string, any>} A plain JavaScript object representation of the FormData.
 */
export function formDataToObject(formData: FormData): Record<string, any> {
    const obj: Record<string, any> = {};
    formData.forEach((value, key) => {
        // Handle multiple values for the same key
        if (obj[key]) {
            if (!Array.isArray(obj[key])) {
                obj[key] = [obj[key]];
            }
            (obj[key] as any[]).push(value);
        } else {
            obj[key] = value;
        }
    });
    return obj;
}

/**
 * Asynchronously reads the content of a `File` object as a text string.
 *
 * @param {File} file - The `File` object to read.
 * @returns {Promise<string>} A promise that resolves with the text content of the file.
 */
export function readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

/**
 * Asynchronously reads the content of a `File` object as a Base64-encoded Data URL.
 *
 * @param {File} file - The `File` object to read.
 * @returns {Promise<string>} A promise that resolves with the Data URL representing the file's content.
 */
export function readFileAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Creates a `Blob` object from a string.
 *
 * @param {string} content - The string content to be put into the Blob.
 * @param {string} [type='text/plain'] - The MIME type of the Blob.
 * @returns {Blob} A new `Blob` object.
 */
export function stringToBlob(content: string, type: string = 'text/plain'): Blob {
    return new Blob([content], { type });
}

/**
 * Creates a `Blob` object from an `ArrayBuffer`.
 *
 * @param {ArrayBuffer} buffer - The `ArrayBuffer` to be put into the Blob.
 * @param {string} [type='application/octet-stream'] - The MIME type of the Blob.
 * @returns {Blob} A new `Blob` object.
 */
export function bufferToBlob(buffer: ArrayBuffer, type: string = 'application/octet-stream'): Blob {
    return new Blob([buffer], { type });
}

/**
 * Triggers a browser download for a file created from a `Blob` object.
 *
 * @param {Blob} blob - The `Blob` containing the file data.
 * @param {string} fileName - The desired name for the downloaded file.
 */
export function downloadBlob(blob: Blob, fileName: string): void {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);

    // Append link to the body and trigger a click
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Appends a `Blob` to a new `FormData` object.
 *
 * @param {Blob} blob - The `Blob` to append.
 * @param {string} name - The name of the field to append the blob as.
 * @param {string} [fileName='file'] - The filename to associate with the blob in the `FormData`.
 * @returns {FormData} A new `FormData` object containing the blob.
 */
export function blobToFormData(blob: Blob, name: string, fileName: string = 'file'): FormData {
    const formData = new FormData();
    formData.append(name, blob, fileName);
    return formData;
}