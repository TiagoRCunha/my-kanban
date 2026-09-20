/**
 * Port that resolves the id of the acting user for local (desktop) mode.
 *
 * The HTTP adapters never pass an actor because the JWT carries identity.
 * Local mode has no token, so the acting user id must come from a resolved
 * local session. Every local repository adapter depends on this port.
 */
export interface LocalActorPort {
  resolveActorId(): Promise<number>;
}
