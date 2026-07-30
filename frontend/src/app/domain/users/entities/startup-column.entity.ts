import { DomainValidators } from '../../shared/domain-validators';

export type StartupColumnSnapshot = {
  id: number;
  title: string;
  position: number;
  type: string;
};

export type CreateStartupColumnInput = {
  title: string;
  position: number;
  type?: string;
};

export type StartupColumnCommand = {
  title: string;
  position: number;
  type: string;
};

export class StartupColumn {
  private constructor(
    public readonly id: number,
    public readonly title: string,
    public readonly position: number,
    public readonly type: string,
  ) {}

  public static fromSnapshot(snapshot: StartupColumnSnapshot): StartupColumn {
    StartupColumn.ensureId(snapshot.id);
    const title = StartupColumn.ensureTitle(snapshot.title);

    return new StartupColumn(snapshot.id, title, snapshot.position, snapshot.type ?? 'NORMAL');
  }

  public static fromCreateInput(
    input: CreateStartupColumnInput,
    tempId: number,
  ): StartupColumn {
    return new StartupColumn(
      tempId,
      (input.title ?? '').trim(),
      input.position,
      input.type ?? 'NORMAL',
    );
  }

  public static toCommand(input: CreateStartupColumnInput): StartupColumnCommand {
    return {
      title: StartupColumn.ensureTitle(input.title),
      position: input.position,
      type: input.type ?? 'NORMAL',
    };
  }

  public withTitle(title: string): StartupColumn {
    return new StartupColumn(this.id, StartupColumn.ensureTitle(title), this.position, this.type);
  }

  public withPosition(position: number): StartupColumn {
    return new StartupColumn(this.id, this.title, position, this.type);
  }

  public withType(type: string): StartupColumn {
    return new StartupColumn(this.id, this.title, this.position, type);
  }

  private static ensureId(id: number): number {
    return DomainValidators.positiveInteger(id, 'StartupColumn id');
  }

  private static ensureTitle(title: string): string {
    return DomainValidators.requiredString(title, 'Startup column title', 50);
  }
}
