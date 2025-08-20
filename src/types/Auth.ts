import { TokensConfig, EndpointsConfig } from "@/types";

export type AuthConfig = {
  endpoints: EndpointsConfig;
  storageKeys: TokensConfig;
}

export interface AuthTokenPaths {
  accessTokenPath?: string;
  refreshTokenPath?: string;
}

export interface AuthResponse {
  [key: string]: any;
}
