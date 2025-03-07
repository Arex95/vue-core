/**
 * Converts a FormData object to a plain JavaScript object.
 * @param {FormData} formData The FormData object to convert.
 * @returns {Record<string, any>} The plain JavaScript object.
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
 * Reads a file as text.
 * @param {File} file The file to read.
 * @returns {Promise<string>} A promise that resolves with the file content.
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
 * Reads a file as a Data URL.
 * @param {File} file The file to read.
 * @returns {Promise<string>} A promise that resolves with the Data URL.
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
 * Creates a Blob from a string.
 * @param {string} content The string content for the Blob.
 * @param {string} [type='text/plain'] The MIME type of the Blob.
 * @returns {Blob} The Blob object.
 */
export function stringToBlob(content: string, type: string = 'text/plain'): Blob {
    return new Blob([content], { type });
}

/**
 * Creates a Blob from an ArrayBuffer.
 * @param {ArrayBuffer} buffer The ArrayBuffer to convert.
 * @param {string} [type='application/octet-stream'] The MIME type of the Blob.
 * @returns {Blob} The Blob object.
 */
export function bufferToBlob(buffer: ArrayBuffer, type: string = 'application/octet-stream'): Blob {
    return new Blob([buffer], { type });
}

/**
 * Creates and downloads a file from Blob data.
 * @param {Blob} blob The Blob containing the file data.
 * @param {string} fileName The name of the file to create.
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
 * Creates a FormData object containing a Blob.
 * @param {Blob} blob The Blob to include in the FormData.
 * @param {string} name The name of the form field.
 * @param {string} [fileName='file'] The file name for the Blob.
 * @returns {FormData} The FormData object.
 */
export function blobToFormData(blob: Blob, name: string, fileName: string = 'file'): FormData {
    const formData = new FormData();
    formData.append(name, blob, fileName);
    return formData;
}