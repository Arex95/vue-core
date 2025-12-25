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
import {
  setGlobalStorageDriver,
  setGlobalSSRContextGetter,
  setGlobalRedirectStrategy,
  getGlobalSSRContextGetter,
} from "./config/global/storageConfig";
import { getDefaultStorageDriver } from "./utils/storage/drivers";
import { UniversalStorage } from "./utils/storage/UniversalStorage";

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
    // Configurar storage driver
    if (options.storage?.driver) {
      setGlobalStorageDriver(options.storage.driver);
    } else {
      // Auto-detectar según entorno
      const driver = getDefaultStorageDriver();
      setGlobalStorageDriver(driver);
    }

    // Configurar SSR context getter
    if (options.ssr?.getContext) {
      setGlobalSSRContextGetter(options.ssr.getContext);
    }

    // Configurar redirect strategy
    if (options.ssr?.redirectStrategy) {
      setGlobalRedirectStrategy(options.ssr.redirectStrategy);
    }

    // Crear factory de storage para usar en AxiosService
    const storageFactory = (): UniversalStorage => {
      const contextGetter = getGlobalSSRContextGetter();
      const driver = getGlobalStorageDriver();
      const appKey = options.appKey;
      return new UniversalStorage(driver, appKey, contextGetter || undefined);
    };

    configAxios({
      baseURL: options.axios.baseURL,
      headers: options.axios.headers,
      timeout: options.axios.timeout,
      withCredentials: options.axios.withCredentials,
      storageFactory, // Nueva opción para SSR
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
