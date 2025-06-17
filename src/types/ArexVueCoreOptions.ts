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
  apiUrl: string;
}
