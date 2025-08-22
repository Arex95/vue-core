import { objectToFormData } from "@/utils";
import { ContentTypeEnum } from "@/enums";

export class RestStd {
  static resource: string;
  static isFormData: boolean = false;
  static headers: Record<string, string> = {};
  static fetchFn: Function;

  /**
   * Set global headers for all requests.
   * @param headers Object containing headers to be set globally.
   */
  static setHeaders(headers: Record<string, string>) {
    this.headers = { ...this.headers, ...headers };
  }

  /**
   * Convert data to FormData if isFormData is true, otherwise return the data as is.
   * @param data Data to be converted.
   * @returns Data in FormData format or as is.
   */
  static transformData(data: any) {
    if (this.isFormData) {
      const formData = objectToFormData(data);
      return formData;
    }
    return data;
  }

  /**
   * Fetch a list of items from the server.
   *
   * @param params Query parameters for filtering the results.
   * @param options Additional options for the fetch function.
   * @returns The result of the fetch function (typically a promise).
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
   * Fetch a single item by ID from the server.
   *
   * @param id The ID of the item to fetch.
   * @param params Additional query parameters for the request.
   * @param options Additional options for the fetch function.
   * @returns The result of the fetch function (typically a promise).
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
   * Create a new item on the server.
   *
   * @param data The data for the new item to create.
   * @param options Additional options for the fetch function.
   * @returns The result of the fetch function (typically a promise).
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
   * Create multiple new items on the server.
   *
   * @param data An array of data for the items to create.
   * @param options Additional options for the fetch function.
   * @returns The result of the fetch function.
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
   * Update an existing item on the server.
   *
   * @param id The ID of the item to update.
   * @param data The updated data for the item.
   * @param options Additional options for the fetch function.
   * @returns The result of the fetch function (typically a promise).
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
   * Update multiple existing items on the server.
   *
   * @param data An array of data for the items to update (each object should have an ID).
   * @param options Additional options for the fetch function.
   * @returns The result of the fetch function.
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
   * Partially update an existing item on the server.
   *
   * @param id The ID of the item to update.
   * @param data The updated data for the item.
   * @param options Additional options for the fetch function.
   * @returns The result of the fetch function (typically a promise).
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
   * Delete an item from the server.
   *
   * @param id The ID of the item to delete.
   * @param options Additional options for the fetch function.
   * @returns The result of the fetch function (typically a promise).
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
   * Delete multiple items from the server by their IDs.
   *
   * @param ids An array of IDs of the items to delete.
   * @param options Additional options for the fetch function.
   * @returns The result of the fetch function.
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
   * Upsert method that decides whether to create or update based on the presence of 'id'.
   *
   * @param data The data for the item to create or update.
   * @param options Additional options for the fetch function.
   * @returns The result of the fetch function (typically a promise).
   */
  static upsert<T>(data: any, options: object = {}) {
    if (data.id) {
      return this.update(data.id, data, options);
    } else {
      return this.create(data, options);
    }
  }

  /**
   * Custom request method for more flexibility.
   *
   * @param method HTTP method (GET, POST, etc.).
   * @param url The custom URL for the request.
   * @param params Query parameters.
   * @param data Request body data.
   * @param options Additional options for the fetch function.
   * @returns The result of the fetch function (typically a promise).
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
