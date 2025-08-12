import { App } from "vue";
import { ArexVueCoreOptions } from "./types/ArexVueCoreOptions";
import { configEndpoints, configTokenKeys, configAxios, configAppKey } from "./config";

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
  install: async (app: App, options: ArexVueCoreOptions) => {
    if (!options) {
      console.warn(
        "ArexVueCore: No configuration options were provided. The library may not function correctly."
      );
      return;
    }

    try {
      console.log("Starting configuration process...");

      await configAppKey({
        appKey: options.appKey
      });
      console.log("[1/4]-configAppKey executed successfully.");

      await configTokenKeys({
        accessTokenKey: options.tokenKeys.accessToken,
        refreshTokenKey: options.tokenKeys.refreshToken
      });
      console.log("[2/4]-configTokenKeys executed successfully.");

      await configEndpoints({
        loginEndpoint: options.endpoints.login,
        refreshEndpoint: options.endpoints.refresh,
        logoutEndpoint: options.endpoints.logout,
      });
      console.log("[3/4]-configEndpoints executed successfully.");

      await configAxios({
        baseURL: options.apiUrl,
      });
      console.log("[4/4]-configAxios executed successfully.");

      console.log("All configurations completed in the correct order.");
    } catch (error) {
      console.error("Configuration failed:", error);
    }
  },
};

export * from "./rest";
export * from "./composables";
export * from "./config";
export * from "./enums";
export * from "./types";
export * from "./utils";