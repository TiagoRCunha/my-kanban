import { DomainValidators } from '../../shared/domain-validators';
import { StartupColumn } from './startup-column.entity';
import { CustomTagSettings } from './custom-tag-settings.entity';

export type UserConfigSnapshot = {
  id: number;
  userId: number;
  darkMode: boolean;
  defaultTaskLimit: number;
  startupColumns: StartupColumnSnapshot[];
  customTags: CustomTagSettingsSnapshot[];
  createdAt: string;
  updatedAt: string;
};

type StartupColumnSnapshot = {
  id: number;
  title: string;
  position: number;
  type: string;
};

type CustomTagSettingsSnapshot = {
  id: number;
  name: string;
  color: string;
  position: number;
};

export class UserConfig {
  private constructor(
    public readonly id: number,
    public readonly userId: number,
    public readonly darkMode: boolean,
    public readonly defaultTaskLimit: number,
    public readonly startupColumns: StartupColumn[],
    public readonly customTags: CustomTagSettings[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  public static fromSnapshot(snapshot: UserConfigSnapshot): UserConfig {
    DomainValidators.positiveInteger(snapshot.id, 'UserConfig id');
    DomainValidators.positiveInteger(snapshot.userId, 'UserConfig userId');

    return new UserConfig(
      snapshot.id,
      snapshot.userId,
      snapshot.darkMode,
      snapshot.defaultTaskLimit,
      snapshot.startupColumns.map((sc) => StartupColumn.fromSnapshot(sc)),
      snapshot.customTags.map((ct) => CustomTagSettings.fromSnapshot(ct)),
      DomainValidators.isoDate(snapshot.createdAt, 'createdAt'),
      DomainValidators.isoDate(snapshot.updatedAt, 'updatedAt'),
    );
  }

  public withDarkMode(darkMode: boolean): UserConfig {
    return new UserConfig(
      this.id,
      this.userId,
      darkMode,
      this.defaultTaskLimit,
      this.startupColumns,
      this.customTags,
      this.createdAt,
      this.updatedAt,
    );
  }

  public withDefaultTaskLimit(defaultTaskLimit: number): UserConfig {
    return new UserConfig(
      this.id,
      this.userId,
      this.darkMode,
      defaultTaskLimit,
      this.startupColumns,
      this.customTags,
      this.createdAt,
      this.updatedAt,
    );
  }

  public withStartupColumns(columns: StartupColumn[]): UserConfig {
    return new UserConfig(
      this.id,
      this.userId,
      this.darkMode,
      this.defaultTaskLimit,
      columns,
      this.customTags,
      this.createdAt,
      this.updatedAt,
    );
  }

  public withCustomTags(tags: CustomTagSettings[]): UserConfig {
    return new UserConfig(
      this.id,
      this.userId,
      this.darkMode,
      this.defaultTaskLimit,
      this.startupColumns,
      tags,
      this.createdAt,
      this.updatedAt,
    );
  }
}
