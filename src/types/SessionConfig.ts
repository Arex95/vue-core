export type LocationPreference = "local" | "session" | "any";

export type SessionConfig = {
  SESSION_ID: string;
  PERSISTENCE: LocationPreference;
};

export interface InternalSessionState {
  sessionId: string;
  persistencePreference: LocationPreference;
}

export interface SessionConfigObject {
  sessionId?: string;
  persistencePreference?: LocationPreference;
}