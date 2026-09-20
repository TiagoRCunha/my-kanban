import type { LocalActorPort } from '../../../domain/shared/ports/local-actor.port';
import { LocalSessionStore } from './session.store';

/**
 * `LocalActorPort` bound to the current local session: it resolves the id of
 * the user stored by `LocalSessionStore` after a successful log in to the
 * local workspace, mirroring how the JWT carries identity in HTTP mode.
 */
export class SessionLocalActor implements LocalActorPort {
  constructor(private readonly session: LocalSessionStore) {}

  public async resolveActorId(): Promise<number> {
    const userId = this.session.getUserId();
    if (userId == null) {
      throw new Error('No local session. Log in to the local workspace first.');
    }
    return userId;
  }

  public get isAuthenticated(): boolean {
    return this.session.getUserId() !== null;
  }
}