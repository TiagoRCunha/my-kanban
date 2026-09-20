/**
 * Stores the id of the user acting in the local (desktop) workspace. The
 * value is mirrored into `localStorage` so the session survives reloads, with
 * an in-memory fallback for environments without a web storage API.
 */
const LOCAL_SESSION_USER_ID_KEY = 'mykanban_local_session_user_id';

export class LocalSessionStore {
  private memoryUserId: number | null = null;

  public setUserId(userId: number): void {
    this.memoryUserId = userId;
    try {
      window.localStorage.setItem(LOCAL_SESSION_USER_ID_KEY, String(userId));
    } catch {
      // Storage unavailable — the in-memory value is kept as fallback.
    }
  }

  public getUserId(): number | null {
    const memoryValue = this.memoryUserId;
    if (memoryValue !== null) {
      return memoryValue;
    }
    try {
      const raw = window.localStorage.getItem(LOCAL_SESSION_USER_ID_KEY);
      return raw === null ? null : Number(raw);
    } catch {
      return null;
    }
  }

  public clear(): void {
    this.memoryUserId = null;
    try {
      window.localStorage.removeItem(LOCAL_SESSION_USER_ID_KEY);
    } catch {
      // Storage unavailable — nothing to clear.
    }
  }
}