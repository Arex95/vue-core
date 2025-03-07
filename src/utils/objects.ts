/**
 * Converts a Proxy object to a plain object.
 * @param {ProxyConstructor} proxy The Proxy object to convert.
 * @returns {Object} The plain object.
 */
export function proxyToPlainObject(proxy: ProxyConstructor): any {
    if (!proxy) return {};
    const plainObject: any = {};
    for (const property of Object.keys(proxy)) {
        plainObject[property] = proxy[property];
    }
    return plainObject;
}

/**
 * Compares two objects to check if they have the same keys.
 * @param {Object} object1 The first object to compare.
 * @param {Object} object2 The second object to compare.
 * @returns {boolean} True if the objects have the same keys, otherwise false.
 */
export function compareObject(object1: Record<string, any>, object2: Record<string, any>): boolean {
    return Object.keys(object1).every(function (element) {
        return Object.keys(object2).includes(element);
    });
}

/**
 * Deeply compares two objects to check if they are equal.
 * @param {Object} object1 The first object to compare.
 * @param {Object} object2 The second object to compare.
 * @returns {boolean} True if the objects are deeply equal, otherwise false.
 */
export function deepEqual(object1: Record<string, any>, object2: Record<string, any>): boolean {
    if (object1 === object2) return true;

    if (typeof object1 !== 'object' || typeof object2 !== 'object' || object1 === null || object2 === null) {
        return false;
    }

    const keys1 = Object.keys(object1);
    const keys2 = Object.keys(object2);

    if (keys1.length !== keys2.length) {
        return false;
    }

    for (const key of keys1) {
        if (!keys2.includes(key) || !deepEqual(object1[key], object2[key])) {
            return false;
        }
    }

    return true;
}

/**
 * Deeply clones an object.
 * @param {Object} obj The object to clone.
 * @returns {Object} The cloned object.
 */
export function deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (obj instanceof Date) {
        return new Date(obj.getTime()) as unknown as T;
    }

    if (obj instanceof Array) {
        return obj.map(item => deepClone(item)) as unknown as T;
    }

    if (obj instanceof Object) {
        const copy: Record<string, any> = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                copy[key] = deepClone(obj[key]);
            }
        }
        return copy as T;
    }

    throw new Error('Unable to clone object! Its type is not supported.');
}

/**
 * Converts an object to a query string.
 * @param {Object} obj The object to convert.
 * @returns {string} The query string.
 */
export function objectToQueryString(obj: Record<string, any>): string {
    return Object.keys(obj)
        .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]))
        .join('&');
}

// Example usage:
// objectToQueryString({ name: 'John Doe', age: 30 }); // 'name=John%20Doe&age=30'

/**
 * Gets the differences between two objects.
 * @param {Object} object1 The first object.
 * @param {Object} object2 The second object.
 * @returns {Object} An object containing the differences.
 */
export function getObjectDifferences(object1: Record<string, any>, object2: Record<string, any>): Record<string, any> {
    const differences: Record<string, any> = {};

    const keys = new Set([...Object.keys(object1), ...Object.keys(object2)]);

    for (const key of keys) {
        if (object1[key] !== object2[key]) {
            differences[key] = { object1: object1[key], object2: object2[key] };
        }
    }

    return differences;
}

/**
 * Filters an object by a list of keys.
 * @param {Object} obj The object to filter.
 * @param {Array<string>} keys The keys to keep.
 * @returns {Object} The filtered object.
 */
export function filterObjectByKeys(obj: Record<string, any>, keys: string[]): Record<string, any> {
    const filteredObject: Record<string, any> = {};
    for (const key of keys) {
        if (key in obj) {
            filteredObject[key] = obj[key];
        }
    }
    return filteredObject;
}

// Example usage:
// filterObjectByKeys({ name: 'John', age: 30, job: 'Developer' }, ['name', 'job']); // { name: 'John', job: 'Developer' }

/**
 * Deeply merges two objects.
 * @param {Object} target The target object to merge into.
 * @param {Object} source The source object to merge from.
 * @returns {Object} The merged object.
 */
export function deepMerge<T>(target: T, source: Partial<T>): T {
    if (typeof target !== 'object' || typeof source !== 'object') {
        return target;
    }

    for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
            if (source[key] && typeof source[key] === 'object') {
                if (!target[key]) {
                    Object.assign(target, { [key]: {} });
                }
                deepMerge(target[key], source[key] as any);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }

    return target;
}

/**
 * Checks if an object is empty.
 * @param {Object} obj The object to check.
 * @returns {boolean} True if the object is empty, otherwise false.
 */
export function isEmptyObject(obj: Record<string, any>): boolean {
    return Object.keys(obj).length === 0;
}

/**
 * Safely accesses nested properties in an object.
 * @param {Object} obj The object to access.
 * @param {Array<string>} keys The array of keys representing the path.
 * @returns {any} The value at the nested path, or undefined if not found.
 */
export function safeGet(obj: Record<string, any>, keys: string[]): any {
    return keys.reduce((acc, key) => (acc && acc[key] !== undefined) ? acc[key] : undefined, obj);
}

// Example usage:
// safeGet({ a: { b: { c: 10 } } }, ['a', 'b', 'c']); // 10
// safeGet({ a: { b: { c: 10 } } }, ['a', 'x', 'c']); // undefined

/**
 * Removes empty properties (null, undefined, or empty string) from an object.
 * @param {Object} obj The object to clean.
 * @returns {Object} A new object without empty properties.
 */
export function removeEmptyProperties(obj: Record<string, any>): Record<string, any> {
    return Object.keys(obj)
        .filter(key => obj[key] !== null && obj[key] !== undefined && obj[key] !== '')
        .reduce((acc, key) => {
            acc[key] = obj[key];
            return acc;
        }, {} as Record<string, any>);
}

// Example usage:
// removeEmptyProperties({ a: null, b: 2, c: undefined, d: '', e: 'hello' }); // { b: 2, e: 'hello' }

/**
 * Retrieves all keys of an object as an array.
 * @param {Object} obj The object to retrieve keys from.
 * @returns {Array<string>} The array of keys.
 */
export function getObjectKeys(obj: Record<string, any>): string[] {
    return Object.keys(obj);
}

// Example usage:
// getObjectKeys({ name: 'John', age: 30 }); // ['name', 'age']

/**
 * Checks if an object has nested properties.
 * @param {Object} obj The object to check.
 * @returns {boolean} True if there are nested properties, false otherwise.
 */
export function hasNestedProperties(obj: Record<string, any>): boolean {
    return Object.values(obj).some(value => typeof value === 'object' && value !== null);
}

// Example usage:
// hasNestedProperties({ a: 1, b: { c: 2 } }); // true
// hasNestedProperties({ a: 1, b: 2 }); // false

/**
 * Converts an object to FormData, handling nested objects.
 * @param {Object} obj The object to convert.
 * @param {FormData} [formData] The FormData object to append to.
 * @param {string} [parentKey] The parent key for nested objects.
 * @returns {FormData} The FormData object.
 */
export function objectToFormDataEnhanced(obj: Record<string, any>, formData = new FormData(), parentKey = ''): FormData {
    Object.entries(obj).forEach(([key, value]) => {
        const finalKey = parentKey ? `${parentKey}[${key}]` : key;
        if (value && typeof value === 'object' && !(value instanceof File)) {
            objectToFormDataEnhanced(value, formData, finalKey);
        } else {
            formData.append(finalKey, value);
        }
    });
    return formData;
}

// Example usage:
// objectToFormDataEnhanced({ user: { name: 'John', age: 30 } });

/**
 * Converts a JavaScript object into FormData.
 *
 * @param obj - The object to be converted.
 * @param form - An optional FormData instance to use.
 * @param namespace - An optional namespace to use for nested objects.
 * @returns The FormData instance with the object's key-value pairs.
 */
export const objectToFormData = function (obj: any, form?: FormData, namespace?: string): FormData {
    const fd = form || new FormData();
    let formKey: string;

    for (const property in obj) {
        if (obj[property] === undefined) {
            continue;
        }
        if (Object.prototype.hasOwnProperty.call(obj, property)) {
            if (namespace) {
                formKey = `${namespace}[${property}]`;
            } else {
                formKey = property;
            }
            if (typeof obj[property] === 'object' && !(obj[property] instanceof File)) {
                // Recursively handle nested objects
                objectToFormData(obj[property], fd, formKey);
            } else {
                // Convert boolean values to 1/0
                const value = obj[property] === true || obj[property] === false ? Number(obj[property]) : obj[property];
                fd.append(formKey, value);
            }
        }
    }

    return fd;
}

/**
 * Flattens a nested object, bringing all properties to the top level.
 * @param {Object} obj The object to flatten.
 * @param {string} [parentKey] The parent key for nested properties.
 * @param {Object} [result] The resulting flattened object.
 * @returns {Object} The flattened object.
 */
export function flattenObject(obj: Record<string, any>, parentKey = '', result: Record<string, any> = {}): Record<string, any> {
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const propName = parentKey ? `${parentKey}.${key}` : key;
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                flattenObject(obj[key], propName, result);
            } else {
                result[propName] = obj[key];
            }
        }
    }
    return result;
}

// Example usage:
// flattenObject({ a: 1, b: { c: 2, d: { e: 3 } } }); // { 'a': 1, 'b.c': 2, 'b.d.e': 3 }