import { SessionConfig } from "@/types"
import { v4 as uuidv4 } from "uuid"

let sessionId: string = uuidv4()

let sessionConfig: SessionConfig = Object.freeze({
  SESSION_ID: sessionId,
})

/**
 * Configures the session identifier for the active browser session.
 * Once configured, it cannot be modified.
 *
 * @param {string} sessionIdParam - The unique session identifier.
 *
 * @returns {void} Does not return anything, but freezes the session configuration.
 */
export function setSessionConfig(sessionIdParam: string): void {
  sessionConfig = Object.freeze({
    SESSION_ID: sessionIdParam,
  })
}

/**
 * Retrieves the current session identifier configuration.
 *
 * @returns {string} The unique session identifier.
 */
export function getSessionConfig(): string {
  return sessionConfig.SESSION_ID
}

/**
 * Generates a new UUID for the current session.
 *
 * @returns {void} Does not return anything, but updates the session identifier.
 */
export function regenerateSessionId(): void {
  sessionId = uuidv4()
  setSessionConfig(sessionId)
}

/**
 * Retrieves the current session identifier.
 *
 * @returns {string} The unique session identifier.
 */
export function getSessionId(): string {
  return sessionId
}