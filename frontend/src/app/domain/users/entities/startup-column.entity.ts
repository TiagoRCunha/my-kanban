import { DomainValidators } from '../../shared/domain-validators';

export type StartupColumnSnapshot = {
  id: number;
  title: string;
  position: number;
};

export type CreateStartupColumnInput = {
  title: string;
  position: number;
};

export type StartupColumnCommand = {
  title: string;
  position: number;
};

export class StartupColumn {
  private constructor(
    public readonly id: number,
    public readonly title: string,
    public readonly position: number,
  ) {}

  public static fromSnapshot(snapshot: StartupColumnSnapshot): StartupColumn {
    StartupColumn.ensureId(snapshot.id);
    const title = StartupColumn.ensureTitle(snapshot.title);

    return new StartupColumn(snapshot.id, title, snapshot.position);
  }

  public static fromCreateInput(
    input: CreateStartupColumnInput,
    tempId: number,
  ): StartupColumn {
    return new StartupColumn(tempId, StartupColumn.ensureTitle(input.title), input.position);
  }

  public static toCommand(input: CreateStartupColumnInput): StartupColumnCommand {
    return {
      title: StartupColumn.ensureTitle(input.title),
      position: input.position,
    };
  }

  public withTitle(title: string): StartupColumn {
    return new StartupColumn(this.id, StartupColumn.ensureTitle(title), this.position);
  }

  public withPosition(position: number): StartupColumn {
    return new StartupColumn(this.id, this.title, position);
  }

  private static ensureId(id: number): number {
    return DomainValidators.positiveInteger(id, 'StartupColumn id');
  }

  private static ensureTitle(title: string): string {
    return DomainValidators.requiredString(title, 'Startup column title', 50);
  }
}
