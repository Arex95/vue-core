import { App } from "vue";
import { ArexVueCoreOptions } from "./types/ArexVueCoreOptions";
import {
  configEndpoints,
  configTokenKeys,
  configAxios,
  configAppKey,
  configTokenPaths,
  configRefreshTokenPaths,
  configCallbacks,
} from "./config";

/**
 * A Vue plugin that serves as the entry point for the `@arex95/vue-core` library.
 * It initializes and configures all the core modules, such as authentication, API communication,
 * and token management, based on the provided options.
 */
export const ArexVueCore = {
  /**
   * The `install` method required by Vue's plugin system. It is called when `app.use()` is invoked.
   *
   * @param {App} app - The Vue application instance.
   * @param {ArexVueCoreOptions} options - The configuration object for the library.
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
      withCredentials: options.axios.withCredentials,
      setupAuthInterceptors: options.axios.setupAuthInterceptors,
    });
    configCallbacks({
      onRefreshFailed: options.onRefreshFailed,
      onLogout: options.onLogout,
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
export * from "./fetchers";
export * from "./errors";
