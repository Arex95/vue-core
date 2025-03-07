/**
 * Object defining various exception codes.
 * @readonly
 */
export const ExceptionEnum = {
  /**
   * HTTP status code for page access forbidden.
   */
  PAGE_NOT_ACCESS: 403,

  /**
   * HTTP status code for page not found.
   */
  PAGE_NOT_FOUND: 404,

  /**
   * HTTP status code for general server error.
   */
  ERROR: 500,

  /**
   * HTTP status code for bad request.
   */
  BAD_REQUEST: 406,

  /**
   * Custom error code for network errors.
   */
  NET_WORK_ERROR: 10000,

  /**
   * Custom code indicating no data on the page, not actually an exception page.
   */
  PAGE_NOT_DATA: 10100,
} as const;