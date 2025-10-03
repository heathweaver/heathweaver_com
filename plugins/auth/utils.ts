import { Session, User } from "./types.ts";

// Re-export define from the main app utils
export { define } from "../../utils.ts";

export function createSession(user: User): Session {
  return {
    user,
    // Add other session creation logic here
  };
}

export function validateSession(session: Session): boolean {
  // Add session validation logic here
  return true;
}

// Add other authentication utility functions here
