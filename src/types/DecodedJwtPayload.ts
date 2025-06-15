export interface DecodedJwtPayload {
  exp?: number;
  iat?: number;
  nbf?: number;
  iss?: string;
  sub?: string;
  aud?: string | string[];
  [key: string]: unknown;
}
