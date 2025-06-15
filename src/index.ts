import { App } from "vue";
import { ArexVueCoreOptions } from "./types/ArexVueCoreOptions";
import { configEndpoints, configTokenKeys, configAxios } from "./config";

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
    }

    configEndpoints({
      loginEndpoint: options.endpoints.login,
      refreshEndpoint: options.endpoints.refresh,
      logoutEndpoint: options.endpoints.logout
    }
    );
    configTokenKeys({
      accessTokenKey : options.tokenKeys.accessToken,
      refreshTokenKey : options.tokenKeys.refreshToken
    }
    );
    configAxios({
      baseURL: options.apiUrl,
    });
  },
};

export * from "./rest";
export * from "./composables";
export * from "./config";
export * from "./enums";
export * from "./types";
export * from "./utils";
