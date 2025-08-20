import {
  storeAuthToken,
  storeAuthRefreshToken,
} from "@/services/credentials";
import { LocationPreference } from "@/types";
import { getAppKey } from "@config/global/keyConfig";

/**
* Stores the access and refresh tokens in the appropriate storage based on the user's preference.
*
* @param {string} accessToken - El token de acceso.
* @param {string} refreshToken - El token de refresco.
* @param {LocationPreference} persistence - La preferencia de almacenamiento.
*/
export const storeTokens = async (
  accessToken: string,
  refreshToken: string,
  persistence: LocationPreference
) => {
  await storeAuthToken(accessToken, getAppKey(), persistence);
  await storeAuthRefreshToken(refreshToken, getAppKey(), persistence);
};