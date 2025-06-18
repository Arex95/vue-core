export type SessionPreference = "local" | "session";

export type SessionConfig = {
  SESSION_ID: string;
  PERSISTENCE: SessionPreference;
};

export interface InternalSessionState {
  sessionId: string;
  persistencePreference: SessionPreference;
}

export interface SessionConfigObject {
  sessionId?: string;
  persistencePreference?: SessionPreference;
}