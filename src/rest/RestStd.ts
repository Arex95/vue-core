import { objectToFormData } from "@/utils";
import { ContentTypeEnum } from "@/enums";

/**
 * A standardized RESTful service class that provides a generic interface for performing
 * CRUD (Create, Read, Update, Delete) operations on a specific API resource. It is designed
 * to be extended by resource-specific classes. It supports both JSON and FormData requests.
 */
export class RestStd {
  /** The base URL path for the resource (e.g., '/users'). */
  static resource: string;
  /** A flag to determine if request data should be sent as FormData. Defaults to `false`. */
  static isFormData: boolean = false;
  /** A record of global headers to be sent with every request. */
  static headers: Record<string, string> = {};
  /** The function used to make the actual HTTP requests (e.g., an Axios instance). */
  static fetchFn: Function;

  /**
   * Sets global headers that will be included in all subsequent requests made by this class.
   * @param {Record<string, string>} headers - An object containing the headers to be set.
   */
  static setHeaders(headers: Record<string, string>) {
    this.headers = { ...this.headers, ...headers };
  }

  /**
   * Conditionally transforms the request data to FormData if `isFormData` is true.
   * @param {*} data - The data to be potentially transformed.
   * @returns {FormData|*} The transformed data as FormData, or the original data.
   */
  static transformData(data: any) {
    if (this.isFormData) {
      const formData = objectToFormData(data);
      return formData;
    }
    return data;
  }

  /**
   * Fetches a list of items from the resource's endpoint.
   * @template T The expected response type.
   * @param {Record<string, any>} [params] - Query parameters for filtering the results.
   * @param {object} [options={}] - Additional options to be passed to the fetch function.
   * @returns {Promise<T>} The result of the fetch function, typically a promise that resolves with the response data.
   */
  static getAll<T>(params?: Record<string, any>, options: object = {}) {
    return this.fetchFn(
      {
        method: "GET",
        url: this.resource,
        params,
        headers: this.headers,
      },
      options
    );
  }

  /**
   * Fetches a single item by its ID.
   * @template T The expected response type.
   * @param {string|number} id - The unique identifier of the item to fetch.
   * @param {Record<string, any>} [params] - Additional query parameters.
   * @param {object} [options={}] - Additional options for the fetch function.
   * @returns {Promise<T>} The result of the fetch function.
   */
  static getOne<T>(
    id: string | number,
    params?: Record<string, any>,
    options: object = {}
  ) {
    return this.fetchFn(
      {
        method: "GET",
        url: `${this.resource}/${id}`,
        params,
        headers: this.headers,
      },
      options
    );
  }

  /**
   * Creates a new item.
   * @template T The expected response type.
   * @param {*} data - The data for the new item.
   * @param {object} [options={}] - Additional options for the fetch function.
   * @returns {Promise<T>} The result of the fetch function.
   */
  static create<T>(data: any, options: object = {}) {
    const transformedData = this.transformData(data);
    return this.fetchFn(
      {
        method: "POST",
        url: this.resource,
        data: transformedData,
        headers: {
          ...this.headers,
          "Content-Type": this.isFormData
            ? ContentTypeEnum.FORM_DATA
            : ContentTypeEnum.JSON,
        },
      },
      options
    );
  }

  /**
   * Creates multiple new items in a single request.
   * @template T The expected response type.
   * @param {any[]} data - An array of items to create.
   * @param {object} [options={}] - Additional options for the fetch function.
   * @returns {Promise<T>} The result of the fetch function.
   */
  static bulkCreate<T>(data: any[], options: object = {}) {
    const transformedData = this.isFormData
      ? data.map((item) => this.transformData(item))
      : data;
    return this.fetchFn(
      {
        method: "POST",
        url: `${this.resource}/bulk`,
        data: transformedData,
        headers: {
          ...this.headers,
          "Content-Type": this.isFormData
            ? ContentTypeEnum.FORM_DATA
            : ContentTypeEnum.JSON,
        },
      },
      options
    );
  }

  /**
   * Updates an existing item by its ID.
   * @template T The expected response type.
   * @param {string|number} id - The ID of the item to update.
   * @param {*} data - The updated data for the item.
   * @param {object} [options={}] - Additional options for the fetch function.
   * @returns {Promise<T>} The result of the fetch function.
   */
  static update<T>(id: string | number, data: any, options: object = {}) {
    const transformedData = this.transformData(data);
    return this.fetchFn(
      {
        method: "PUT",
        url: `${this.resource}/${id}`,
        data: transformedData,
        headers: {
          ...this.headers,
          "Content-Type": this.isFormData
            ? ContentTypeEnum.FORM_DATA
            : ContentTypeEnum.JSON,
        },
      },
      options
    );
  }

  /**
   * Updates multiple existing items in a single request.
   * @template T The expected response type.
   * @param {any[]} data - An array of items to update. Each item should have an ID.
   * @param {object} [options={}] - Additional options for the fetch function.
   * @returns {Promise<T>} The result of the fetch function.
   */
  static bulkUpdate<T>(data: any[], options: object = {}) {
    const transformedData = this.isFormData
      ? data.map((item) => this.transformData(item))
      : data;
    return this.fetchFn(
      {
        method: "PUT",
        url: `${this.resource}/bulk`,
        data: transformedData,
        headers: {
          ...this.headers,
          "Content-Type": this.isFormData
            ? ContentTypeEnum.FORM_DATA
            : ContentTypeEnum.JSON,
        },
      },
      options
    );
  }

  /**
   * Partially updates an existing item by its ID.
   * @template T The expected response type.
   * @param {string|number} id - The ID of the item to update.
   * @param {*} data - The partial data for the item.
   * @param {object} [options={}] - Additional options for the fetch function.
   * @returns {Promise<T>} The result of the fetch function.
   */
  static patch<T>(id: string | number, data: any, options: object = {}) {
    const transformedData = this.transformData(data);
    return this.fetchFn(
      {
        method: "PATCH",
        url: `${this.resource}/${id}`,
        data: transformedData,
        headers: {
          ...this.headers,
          "Content-Type": this.isFormData
            ? ContentTypeEnum.FORM_DATA
            : ContentTypeEnum.JSON,
        },
      },
      options
    );
  }

  /**
   * Deletes an item by its ID.
   * @template T The expected response type.
   * @param {string|number} id - The ID of the item to delete.
   * @param {object} [options={}] - Additional options for the fetch function.
   * @returns {Promise<T>} The result of the fetch function.
   */
  static delete<T>(id: string | number, options: object = {}) {
    return this.fetchFn(
      {
        method: "DELETE",
        url: `${this.resource}/${id}`,
        headers: this.headers,
      },
      options
    );
  }

  /**
   * Deletes multiple items by their IDs in a single request.
   * @template T The expected response type.
   * @param {(string|number)[]} ids - An array of IDs of the items to delete.
   * @param {object} [options={}] - Additional options for the fetch function.
   * @returns {Promise<T>} The result of the fetch function.
   */
  static bulkDelete<T>(ids: (string | number)[], options: object = {}) {
    return this.fetchFn(
      {
        method: "DELETE",
        url: `${this.resource}/bulk`,
        data: { ids },
        headers: this.headers,
      },
      options
    );
  }

  /**
   * Creates a new item or updates an existing one, based on the presence of an `id` property in the data.
   * @template T The expected response type.
   * @param {*} data - The data for the item to be created or updated.
   * @param {object} [options={}] - Additional options for the fetch function.
   * @returns {Promise<T>} The result of the create or update operation.
   */
  static upsert<T>(data: any, options: object = {}) {
    if (data.id) {
      return this.update(data.id, data, options);
    } else {
      return this.create(data, options);
    }
  }

  /**
   * Makes a custom HTTP request, providing full flexibility over the method, URL, and data.
   * @template T The expected response type.
   * @param {string} method - The HTTP method (e.g., 'GET', 'POST').
   * @param {string} url - The URL for the request.
   * @param {Record<string, any>} [params] - Query parameters.
   * @param {*} [data] - The request body data.
   * @param {object} [options={}] - Additional options for the fetch function.
   * @returns {Promise<T>} The result of the fetch function.
   */
  static customRequest<T>(
    method: string,
    url: string,
    params?: Record<string, any>,
    data?: any,
    options: object = {}
  ) {
    const transformedData = this.transformData(data);
    return this.fetchFn(
      {
        method: method,
        url: url,
        params: params,
        data: transformedData,
        headers: {
          ...this.headers,
          "Content-Type": this.isFormData
            ? ContentTypeEnum.FORM_DATA
            : ContentTypeEnum.JSON,
        },
      },
      options
    );
  }
}
