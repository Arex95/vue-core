import { SessionConfig } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { storeEncryptedItem, getDecryptedItem } from "@utils/storage";
import { getAppKey } from "@config/global";

export type SessionPreference = "local" | "session";

let sessionId: string = uuidv4();

let sessionConfig: SessionConfig = Object.freeze({
  SESSION_ID: sessionId,
});

let persistencePreference: SessionPreference = "session";

/**
 * Configuration object for the session.
 */
interface SessionConfigObject {
  /** The unique session identifier. */
  sessionId?: string;
  /** The storage preference: 'local' for localStorage, 'session' for sessionStorage. */
  persistencePreference?: SessionPreference;
}

/**
 * Loads the session configuration from storage (local or session).
 * This should be called once when the application initializes.
 */
export async function loadSessionConfigFromStorage(): Promise<void> {
  const isPersistent = persistencePreference === "local";
  const storedConfig = await getDecryptedItem(
    "sessionConfig",
    getAppKey(),
    isPersistent
  );
  if (storedConfig) {
    try {
      const parsedConfig = JSON.parse(storedConfig);
      sessionConfig = Object.freeze({
        ...sessionConfig,
        ...parsedConfig,
      });
      if (parsedConfig.SESSION_ID) {
        sessionId = parsedConfig.SESSION_ID;
      }
    } catch (error) {
      console.error("Error parsing stored session config:", error);
      regenerateSessionId();
    }
  } else {
    regenerateSessionId();
  }
  await saveSessionConfigToStorage();
}

/**
 * Saves the current session configuration to local or session storage.
 */
async function saveSessionConfigToStorage(): Promise<void> {
  const isPersistent = persistencePreference === "local";
  try {
    await storeEncryptedItem(
      "sessionConfig",
      JSON.stringify(sessionConfig),
      getAppKey(),
      isPersistent
    );
  } catch (error) {
    console.error("Error saving session config to storage:", error);
  }
}

/**
 * Configures the session identifier and/or the data persistence preference for the active browser session.
 * Once configured, the session ID cannot be modified. The persistence preference can be updated.
 *
 * @param {SessionConfigObject} config - An object containing the unique session identifier and/or persistence preference.
 *
 * @returns {void} Does not return anything, but freezes the session configuration (for ID) and updates preference.
 */
export function configSession(config: SessionConfigObject): void {
  let updatedConfig = { ...sessionConfig };

  if (config.sessionId && sessionConfig.SESSION_ID === sessionId) {
    updatedConfig = {
      ...updatedConfig,
      SESSION_ID: config.sessionId,
    };
    sessionId = config.sessionId;
  }

  if (config.persistencePreference) {
    persistencePreference = config.persistencePreference;
  }

  sessionConfig = Object.freeze(updatedConfig);
  saveSessionConfigToStorage();
}

/**
 * Retrieves the current session identifier configuration.
 *
 * @returns {string} The unique session identifier.
 */
export function getSessionConfig(): string {
  return sessionConfig.SESSION_ID;
}

/**
 * Retrieves the current data persistence preference.
 *
 * @returns {SessionPreference} The configured persistence preference ('local' or 'session').
 */
export function getSessionPersistencePreference(): SessionPreference {
  return persistencePreference;
}

/**
 * Generates a new UUID for the current session.
 *
 * @returns {void} Does not return anything, but updates the session identifier.
 */
export function regenerateSessionId(): void {
  sessionId = uuidv4();
  configSession({ sessionId: sessionId });
}

/**
 * Retrieves the current session identifier.
 *
 * @returns {string} The unique session identifier.
 */
export function getSessionId(): string {
  return sessionId;
}
