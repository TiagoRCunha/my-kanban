import { CustomTagSettingsCommand } from '../entities/custom-tag-settings.entity';
import { StartupColumnCommand } from '../entities/startup-column.entity';
import { UserConfigSnapshot } from '../entities/user-config.entity';

export interface UserConfigRepositoryPort {
  getConfig(userId: number): Promise<UserConfigSnapshot>;
  updateDarkMode(userId: number, darkMode: boolean): Promise<void>;
  updateConfig(userId: number, config: { darkMode?: boolean; defaultTaskLimit?: number }): Promise<void>;
  saveStartupColumns(
    userId: number,
    columns: StartupColumnCommand[],
  ): Promise<{ id: number; title: string; position: number }[]>;
  createCustomTag(
    userId: number,
    tag: CustomTagSettingsCommand,
  ): Promise<{ id: number; name: string; color: string; position: number }>;
  updateCustomTag(
    userId: number,
    tagId: number,
    tag: CustomTagSettingsCommand,
  ): Promise<{ id: number; name: string; color: string; position: number }>;
  deleteCustomTag(userId: number, tagId: number): Promise<void>;
}
