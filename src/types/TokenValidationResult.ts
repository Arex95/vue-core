/**
 * Represents the successful result of a token extraction and validation operation.
 * This type is used to ensure that both the access and refresh tokens are returned
 * as strings after being validated.
 */
export type TokenValidationResult = {
  /** The validated access token. */
  accessToken: string;
  /** The validated refresh token. */
  refreshToken: string;
};
