import { App } from "vue";
import { ArexVueCoreOptions } from "@types";
import { configEndpoints, configTokenKeys, configAxios } from "@config";

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

    configEndpoints(
      options.endpoints.login,
      options.endpoints.refresh,
      options.endpoints.logout
    );
    configTokenKeys(
      options.tokenKeys.accessToken,
      options.tokenKeys.refreshToken
    );
    configAxios(options.apiUrl);
  },
};

export * from "./rest";
export * from "./composables";
export * from "./config";
export * from "./enums";
export * from "./types";
export * from "./utils";
