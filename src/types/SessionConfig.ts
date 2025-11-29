/**
 * Defines the possible storage locations for session data.
 * - `local`: `localStorage`, persists after the browser is closed.
 * - `session`: `sessionStorage`, cleared when the browser is closed.
 * - `any`: Used for retrieval operations to check both `localStorage` and `sessionStorage`.
 */
export type LocationPreference = "local" | "session" | "any";

/**
 * Defines the structure of the session configuration object that is stored and retrieved.
 */
export type SessionConfig = {
  /** The unique identifier for the current session. */
  SESSION_ID: string;
  /** The chosen storage location for the session data. */
  PERSISTENCE: LocationPreference;
};

/**
 * Represents the internal, mutable state of the session configuration.
 * This is used within the session management module to track the current settings.
 */
export interface InternalSessionState {
  /** The current session ID. */
  sessionId: string;
  /** The current persistence preference. */
  persistencePreference: LocationPreference;
}

/**
 * Defines the structure for the object used to configure the session.
 * All properties are optional, allowing for partial updates to the session configuration.
 */
export interface SessionConfigObject {
  /** An optional new session ID. */
  sessionId?: string;
  /** An optional new persistence preference. */
  persistencePreference?: LocationPreference;
}