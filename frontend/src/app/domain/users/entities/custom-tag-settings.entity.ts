import { DomainValidators } from '../../shared/domain-validators';

export type CustomTagSettingsSnapshot = {
  id: number;
  name: string;
  color: string;
  position: number;
};

export type CreateCustomTagInput = {
  name: string;
  color: string;
  position: number;
};

export type CustomTagSettingsCommand = {
  name: string;
  color: string;
  position: number;
};

export class CustomTagSettings {
  private constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly color: string,
    public readonly position: number,
  ) {}

  public static fromSnapshot(snapshot: CustomTagSettingsSnapshot): CustomTagSettings {
    CustomTagSettings.ensureId(snapshot.id);
    const name = CustomTagSettings.ensureName(snapshot.name);
    const color = CustomTagSettings.ensureColor(snapshot.color);

    return new CustomTagSettings(snapshot.id, name, color, snapshot.position);
  }

  public static fromCreateInput(
    input: CreateCustomTagInput,
    tempId: number,
  ): CustomTagSettings {
    return new CustomTagSettings(
      tempId,
      (input.name ?? '').trim(),
      input.color?.trim() || '#0052CC',
      input.position,
    );
  }

  public static toCommand(input: CreateCustomTagInput): CustomTagSettingsCommand {
    return {
      name: CustomTagSettings.ensureName(input.name),
      color: CustomTagSettings.ensureColor(input.color),
      position: input.position,
    };
  }

  private static ensureId(id: number): number {
    return DomainValidators.positiveInteger(id, 'CustomTag id');
  }

  private static ensureName(name: string): string {
    return DomainValidators.requiredString(name, 'Tag name', 50);
  }

  private static ensureColor(color: string): string {
    const trimmed = color.trim();
    if (!trimmed) {
      throw new Error('Tag color is required.');
    }
    if (!/^#[0-9A-Fa-f]{6}$/.test(trimmed)) {
      throw new Error('Tag color must be a valid hex color code (e.g. #FF5733).');
    }
    return trimmed;
  }
}
