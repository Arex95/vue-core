import { TokenConfig, EndpointsConfig } from "@/types";

export type AuthConfig = {
  endpoints: EndpointsConfig;
  storageKeys: TokenConfig;
}
