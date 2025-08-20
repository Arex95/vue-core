import { App } from "vue";
import { ArexVueCoreOptions } from "./types/ArexVueCoreOptions";
import {
  configEndpoints,
  configTokenKeys,
  configAxios,
  configAppKey,
  configTokenPaths,
  configRefreshTokenPaths,
} from "./config";

/**
 * The Vue plugin for @arex95/vue-core.
 * Configures the core functionalities for authentication and API communication.
 */
export const ArexVueCore = {
  /**
   * The `install` method is the entry point for the Vue plugin.
   * It is automatically called when `app.use(ArexVueCore, options)` is executed.
   *
   * @param app The Vue application instance.
   * @param options The configuration options provided by the user.
   */
  install: (app: App, options: ArexVueCoreOptions) => {
    if (!options) {
      console.warn(
        "ArexVueCore: No configuration options were provided. The library may not function correctly."
      );
      return;
    };

    configAppKey({
      appKey: options.appKey
    });
    configTokenKeys({
      accessTokenKey: options.tokenKeys.accessToken,
      refreshTokenKey: options.tokenKeys.refreshToken,
    });
    configEndpoints({
      loginEndpoint: options.endpoints.login,
      refreshEndpoint: options.endpoints.refresh,
      logoutEndpoint: options.endpoints.logout,
    });
    configTokenPaths({
      accessTokenPath: options.tokenPaths.accessToken,
      refreshTokenPath: options.tokenPaths.refreshToken,
    });
    configRefreshTokenPaths({
      accessTokenPath: options.refreshTokenPaths.accessToken,
      refreshTokenPath: options.refreshTokenPaths.refreshToken,
    });
    configAxios({
      baseURL: options.axios.baseURL,
      headers: options.axios.headers,
      timeout: options.axios.timeout,
      withCredentials: options.axios.withCredentials
    });
  },
};

export * from "./rest";
export * from "./composables";
export * from "./config";
export * from "./enums";
export * from "./types";
export * from "./utils";
export * from "./services";
