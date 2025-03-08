/**
 * A standard REST API interface for handling basic CRUD operations.
 * This class can be instantiated with a resource endpoint and a fetch composable for API requests.
 */
export class RestStd {
    static resource: string;
    static fetchComposable: Function;

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
        }, options);
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
        }, options);
    }

    /**
     * Create a new item on the server.
     *
     * @param data The data for the new item to create.
     * @param options Additional options for the fetch composable.
     * @returns The result of the fetch composable (typically a promise).
     */
    static create<T>(data: any, options: object = {}) {
        return this.fetchComposable({
            method: 'POST',
            url: this.resource,
            data,
        }, options);
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
        return this.fetchComposable({
            method: 'PUT',
            url: `${this.resource}/${id}`,
            data,
        }, options);
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
        return this.fetchComposable({
            method: 'PATCH',
            url: `${this.resource}/${id}`,
            data,
        }, options);
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
        }, options);
    }

    /**
     * Custom request method for more flexibility.
     *
     * @param method HTTP method (GET, POST, etc.).
     * @param params Query parameters.
     * @param data Request body data.
     * @param token Authorization token (optional).
     * @param options Additional options for the fetch composable.
     * @returns The result of the fetch composable (typically a promise).
     */
    static customRequest<T>(
        method: string,
        params?: Record<string, any>,
        data?: any,
        options: object = {}
    ) {
        return this.fetchComposable({
            method: method,
            url: this.resource,
            params: params,
            data: data,
        }, options);
    }
}