import type { LocalActorPort } from '../../../../domain/shared/ports/local-actor.port';
import type { LocalBackend } from '../../local-backend';
import type { UserConfigRepositoryPort } from '../../../../domain/users/ports/user-config-repository.port';
import type { UserConfigSnapshot } from '../../../../domain/users/entities/user-config.entity';
import type { CustomTagSettingsCommand } from '../../../../domain/users/entities/custom-tag-settings.entity';
import type { StartupColumnCommand } from '../../../../domain/users/entities/startup-column.entity';
import { UserConfigMapper } from '../../../user-config/mappers/user-config.mapper';

/**
 * Local (desktop) adapter for user configuration, backed by `LocalBackend`.
 * Every call resolves the acting user id from the given `LocalActorPort` so
 * the backend can enforce that a user only manages their own configuration.
 * Mirrors the `HttpUserConfigAdapter` / `UserConfigRepositoryPort` contract.
 */
export class LocalUserConfigRepository implements UserConfigRepositoryPort {
  constructor(
    private readonly backend: LocalBackend,
    private readonly actor: LocalActorPort,
  ) {}

  public async getConfig(userId: number): Promise<UserConfigSnapshot> {
    const actorId = await this.actor.resolveActorId();
    return UserConfigMapper.toSnapshot(await this.backend.getUserConfig(actorId, userId));
  }

  public async updateDarkMode(userId: number, darkMode: boolean): Promise<void> {
    const actorId = await this.actor.resolveActorId();
    await this.backend.updateUserConfig(actorId, userId, { darkMode });
  }

  public async updateConfig(
    userId: number,
    config: { darkMode?: boolean; defaultTaskLimit?: number },
  ): Promise<void> {
    const actorId = await this.actor.resolveActorId();
    await this.backend.updateUserConfig(actorId, userId, config);
  }

  public async saveStartupColumns(
    userId: number,
    columns: StartupColumnCommand[],
  ): Promise<{ id: number; title: string; position: number; type: string }[]> {
    const actorId = await this.actor.resolveActorId();
    return this.backend.saveStartupColumns(
      actorId,
      userId,
      columns.map((c) => ({
        title: c.title,
        position: c.position,
        type: c.type ?? 'NORMAL',
      })),
    );
  }

  public async createCustomTag(
    userId: number,
    tag: CustomTagSettingsCommand,
  ): Promise<{ id: number; name: string; color: string; position: number }> {
    const actorId = await this.actor.resolveActorId();
    return this.backend.createCustomTag(actorId, userId, {
      name: tag.name,
      color: tag.color,
      position: tag.position,
    });
  }

  public async updateCustomTag(
    userId: number,
    tagId: number,
    tag: CustomTagSettingsCommand,
  ): Promise<{ id: number; name: string; color: string; position: number }> {
    const actorId = await this.actor.resolveActorId();
    return this.backend.updateCustomTag(actorId, userId, tagId, {
      name: tag.name,
      color: tag.color,
      position: tag.position,
    });
  }

  public async deleteCustomTag(userId: number, tagId: number): Promise<void> {
    const actorId = await this.actor.resolveActorId();
    await this.backend.deleteCustomTag(actorId, userId, tagId);
  }
}