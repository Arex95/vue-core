import { objectToFormData } from '@/utils'
import { ContentTypeEnum } from '@/enums'

export class RestStd {
    static resource: string
    static isFormData: boolean = false
    static headers: Record<string, string> = {}
    static fetchComposable: Function

    /**
     * Set global headers for all requests.
     * @param headers Object containing headers to be set globally.
     */
    static setHeaders(headers: Record<string, string>) {
        this.headers = { ...this.headers, ...headers }
    }

    /**
     * Convert data to FormData if isFormData is true, otherwise return the data as is.
     * @param data Data to be converted.
     * @returns Data in FormData format or as is.
     */
    static transformData(data: any) {
        if (this.isFormData) {
            const formData = objectToFormData(data)
            return formData
        }
        return data
    }

    /**
     * Fetch a list of items from the server.
     *
     * @param params Query parameters for filtering the results.
     * @param options Additional options for the fetch composable.
     * @returns The result of the fetch composable (typically a promise).
     */
    static getMany<T>(params?: Record<string, any>, options: object = {}) {
        return this.fetchComposable({
            method: 'GET',
            url: this.resource,
            params,
            headers: this.headers,
        }, options)
    }

    /**
     * Fetch a single item by ID from the server.
     *
     * @param id The ID of the item to fetch.
     * @param params Additional query parameters for the request.
     * @param options Additional options for the fetch composable.
     * @returns The result of the fetch composable (typically a promise).
     */
    static getOne<T>(id: string | number, params?: Record<string, any>, options: object = {}) {
        return this.fetchComposable({
            method: 'GET',
            url: `${this.resource}/${id}`,
            params,
            headers: this.headers,
        }, options)
    }

    /**
     * Create a new item on the server.
     *
     * @param data The data for the new item to create.
     * @param options Additional options for the fetch composable.
     * @returns The result of the fetch composable (typically a promise).
     */
    static create<T>(data: any, options: object = {}) {
        const transformedData = this.transformData(data)
        return this.fetchComposable({
            method: 'POST',
            url: this.resource,
            data: transformedData,
            headers: {
                ...this.headers,
                'Content-Type': this.isFormData ? ContentTypeEnum.FORM_DATA : ContentTypeEnum.JSON,
            },
        }, options)
    }

    /**
     * Update an existing item on the server.
     *
     * @param id The ID of the item to update.
     * @param data The updated data for the item.
     * @param options Additional options for the fetch composable.
     * @returns The result of the fetch composable (typically a promise).
     */
    static update<T>(id: string | number, data: any, options: object = {}) {
        const transformedData = this.transformData(data)
        return this.fetchComposable({
            method: 'PUT',
            url: `${this.resource}/${id}`,
            data: transformedData,
            headers: {
                ...this.headers,
                'Content-Type': this.isFormData ? ContentTypeEnum.FORM_DATA : ContentTypeEnum.JSON,
            },
        }, options)
    }

    /**
     * Partially update an existing item on the server.
     *
     * @param id The ID of the item to update.
     * @param data The updated data for the item.
     * @param options Additional options for the fetch composable.
     * @returns The result of the fetch composable (typically a promise).
     */
    static patch<T>(id: string | number, data: any, options: object = {}) {
        const transformedData = this.transformData(data)
        return this.fetchComposable({
            method: 'PATCH',
            url: `${this.resource}/${id}`,
            data: transformedData,
            headers: {
                ...this.headers,
                'Content-Type': this.isFormData ? ContentTypeEnum.FORM_DATA : ContentTypeEnum.JSON,
            },
        }, options)
    }

    /**
     * Delete an item from the server.
     *
     * @param id The ID of the item to delete.
     * @param options Additional options for the fetch composable.
     * @returns The result of the fetch composable (typically a promise).
     */
    static delete<T>(id: string | number, options: object = {}) {
        return this.fetchComposable({
            method: 'DELETE',
            url: `${this.resource}/${id}`,
            headers: this.headers,
        }, options)
    }

    /**
     * Custom request method for more flexibility.
     *
     * @param method HTTP method (GET, POST, etc.).
     * @param params Query parameters.
     * @param data Request body data.
     * @param options Additional options for the fetch composable.
     * @returns The result of the fetch composable (typically a promise).
     */
    static customRequest<T>(
        method: string,
        params?: Record<string, any>,
        data?: any,
        options: object = {}
    ) {
        const transformedData = this.transformData(data)
        return this.fetchComposable({
            method: method,
            url: this.resource,
            params: params,
            data: transformedData,
            headers: {
                ...this.headers,
                'Content-Type': this.isFormData ? ContentTypeEnum.FORM_DATA : ContentTypeEnum.JSON,
            },
        }, options)
    }

    /**
     * Save method that decides whether to create or update based on the presence of 'id'.
     * It calls either create or update based on the data.
     *
     * @param data The data for the item to create or update.
     * @param options Additional options for the fetch composable.
     * @returns The result of the fetch composable (typically a promise).
     */
    static save<T>(data: any, options: object = {}) {
        if (data.id) {
            return this.update(data.id, data, options)
        } else {
            return this.create(data, options)
        }
    }
}