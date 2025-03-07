/**
 * Object representing different content types for HTTP headers.
 * @readonly
 */
export const ContentTypeEnum = {
  /**
   * Content type for JSON.
   * @constant
   */
  JSON: 'application/json;charset=UTF-8',

  /**
   * Content type for URL-encoded form data.
   * @constant
   */
  FORM_URLENCODED: 'application/x-www-form-urlencoded;charset=UTF-8',

  /**
   * Content type for multipart form data with file uploads.
   * @constant
   */
  FORM_DATA: 'multipart/form-data;charset=UTF-8',
} as const;