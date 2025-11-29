/**
 * Represents the payload of a decoded JSON Web Token (JWT).
 * This interface includes the standard registered claims (`exp`, `iat`, etc.)
 * as well as an index signature to allow for any custom claims.
 */
export interface DecodedJwtPayload {
  /** The expiration time of the token, as a Unix timestamp. */
  exp?: number;
  /** The time the token was issued, as a Unix timestamp. */
  iat?: number;
  /** The time before which the token must not be accepted for processing, as a Unix timestamp. */
  nbf?: number;
  /** The issuer of the token. */
  iss?: string;
  /** The subject of the token. */
  sub?: string;
  /** The audience of the token. */
  aud?: string | string[];
  /** Allows for any other custom claims to be present in the payload. */
  [key: string]: unknown;
}
