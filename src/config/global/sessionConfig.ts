import { v4 as uuidv4 } from "uuid";
import { storeEncryptedItem, getDecryptedItem } from "@utils/storage";
import { getAppKey } from "@config/global/keyConfig";
import {
  InternalSessionState,
  SessionPreference,
  SessionConfigObject,
  SessionConfig
} from "@/types/SessionConfig";

const SESSION_KEY = "session_config_";

const internalSessionState: InternalSessionState = {
  sessionId: uuidv4(),
  persistencePreference: "session",
};

let _sessionConfig: SessionConfig = Object.freeze({
  SESSION_ID: internalSessionState.sessionId,
  PERSISTENCE: internalSessionState.persistencePreference,
});

/**
 * Updates the immutable `_sessionConfig` object with the current state of `internalSessionState`
 * and freezes it.
 */
function updateSessionConfig(): void {
  _sessionConfig = Object.freeze({
    SESSION_ID: internalSessionState.sessionId,
    PERSISTENCE: internalSessionState.persistencePreference,
  });
}

/**
 * Saves the current session configuration to local or session storage.
 * @returns {Promise<void>} A promise that resolves when the session configuration has been saved.
 */
async function saveSessionConfig(): Promise<void> {
  const isPersistent = internalSessionState.persistencePreference === "local";
  try {
    await storeEncryptedItem(
      SESSION_KEY,
      JSON.stringify(_sessionConfig),
      getAppKey(),
      isPersistent
    );
  } catch (error) {
    console.error("Error saving session configuration to storage:", error);
  }
}

/**
 * Attempts to load the configuration from storage.
 * If it fails or is not found, `internalSessionState` will retain its current values (initial or last configured).
 * Then, it updates `_sessionConfig`.
 *
 * @returns {Promise<void>} A promise that resolves when the state has been loaded and updated.
 */
async function loadSessionConfig(): Promise<void> {
  try {
    const storedConfig = await getDecryptedItem(SESSION_KEY, getAppKey(), true);
    if (storedConfig) {
      const parsedConfig = JSON.parse(storedConfig);
      internalSessionState.sessionId = parsedConfig.SESSION_ID;
      internalSessionState.persistencePreference = parsedConfig.PERSISTENCE;
      updateSessionConfig();
    }
  } catch (error) {
    console.warn(`Error loading or parsing from storage`, error);
  }
}

/**
 * Configures the session identifier and/or data persistence preference
 * for the active browser session.
 *
 * This function is asynchronous because it will always attempt to load the current configuration
 * before applying changes and then saving them.
 *
 * @param {SessionConfigObject} config - An object containing the unique session identifier and/or
 * the persistence preference.
 * @returns {Promise<void>} A promise that resolves when the session has been configured and saved.
 */
export async function configSession(
  config: SessionConfigObject
): Promise<void> {
  if (config.sessionId) {
    internalSessionState.sessionId = config.sessionId;
  }
  if (config.persistencePreference) {
    internalSessionState.persistencePreference = config.persistencePreference;
  }
  updateSessionConfig();
  await saveSessionConfig();
}

/**
 * Retrieves the current session identifier.
 * Always attempts to load the configuration from storage. If it fails, it uses the internal state.
 *
 * @returns {Promise<string>} A promise that resolves with the unique session identifier.
 */
export async function getSessionId(): Promise<string> {
  await loadSessionConfig();
  return _sessionConfig.SESSION_ID;
}

/**
 * Retrieves the current data persistence preference.
 * Always attempts to load the configuration from storage. If it fails, it uses the internal state.
 *
 * @returns {Promise<SessionPreference>} A promise that resolves with the configured persistence preference ('local' or 'session').
 */
export async function getSessionPersistence(): Promise<SessionPreference> {
  await loadSessionConfig();
  return _sessionConfig.PERSISTENCE;
}

/**
 * Retrieves the complete session configuration.
 * Always attempts to load the configuration from storage. If it fails, it uses the internal state.
 *
 * @returns {Promise<SessionConfig>} A promise that resolves with the session configuration object.
 */
export async function getSessionConfig(): Promise<SessionConfig> {
  await loadSessionConfig();
  return _sessionConfig;
}
