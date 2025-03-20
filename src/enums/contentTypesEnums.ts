/**
 * Enum representing different content types for HTTP headers.
 * @readonly
 */
export enum ContentTypeEnum {
  /**
   * Content type for JSON.
   * @constant
   */
  JSON = 'application/json;charset=UTF-8',

  /**
   * Content type for URL-encoded form data.
   * @constant
   */
  FORM_URLENCODED = 'application/x-www-form-urlencoded;charset=UTF-8',

  /**
   * Content type for multipart form data with file uploads.
   * @constant
   */
  FORM_DATA = 'multipart/form-data;charset=UTF-8',

  /**
   * Content type for plain text.
   * @constant
   */
  TEXT_PLAIN = 'text/plain;charset=UTF-8',

  /**
   * Content type for XML data.
   * @constant
   */
  XML = 'application/xml;charset=UTF-8',

  /**
   * Content type for HTML data.
   * @constant
   */
  HTML = 'text/html;charset=UTF-8',

  /**
   * Content type for JavaScript files.
   * @constant
   */
  JS = 'application/javascript;charset=UTF-8',

  /**
   * Content type for CSV files.
   * @constant
   */
  CSV = 'text/csv;charset=UTF-8',

  /**
   * Content type for PDF files.
   * @constant
   */
  PDF = 'application/pdf',

  /**
   * Content type for octet-stream (binary data).
   * @constant
   */
  OCTET_STREAM = 'application/octet-stream',
}