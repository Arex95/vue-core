import { AxiosServiceOptions } from "./AxiosServiceOptions";

export interface ArexVueCoreOptions {
  appKey: string;
  endpoints: {
    login: string;
    refresh: string;
    logout: string;
  };
  tokenKeys: {
    accessToken: string;
    refreshToken: string;
  };
  tokenPaths: {
    accessToken: string;
    refreshToken: string;
  };
  refreshTokenPaths: {
    accessToken: string;
    refreshToken: string;
  };
  axios: AxiosServiceOptions;
}
