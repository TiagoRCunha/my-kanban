import type { LocalActorPort } from '../../../../domain/shared/ports/local-actor.port';

/**
 * Deterministic, hold-fixed actor for the local (desktop) veneer: always
 * resolves to the given user id, standing in for what the JWT carries for
 * the HTTP adapters.
 */
export class StaticLocalActor implements LocalActorPort {
  constructor(private readonly actorId: number) {}

  public async resolveActorId(): Promise<number> {
    return this.actorId;
  }
}
