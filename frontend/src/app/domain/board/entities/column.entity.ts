import { DomainValidators } from "../../shared/domain-validators";

export type ColumnSnapshot = {
  id: number;
  title: string;
  position: number;
  archived: boolean;
  isDone: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateColumnInput = {
  title: string;
  position: number;
  archived?: boolean;
  isDone?: boolean;
};

export type UpdateColumnInput = {
  title: string;
  position: number;
  archived?: boolean;
  isDone?: boolean;
};

export type ColumnCommand = {
  title: string;
  position: number;
  archived?: boolean;
  isDone?: boolean;
};

export class Column {
  private constructor(
    public readonly id: number,
    public readonly title: string,
    public readonly position: number,
    public readonly archived: boolean,
    public readonly isDone: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) { }

  public static fromSnapshot(snapshot: ColumnSnapshot): Column {
    Column.ensureId(snapshot.id);
    const title = Column.ensureTitle(snapshot.title);
    const position = Column.ensurePosition(snapshot.position);

    return new Column(
      snapshot.id,
      title,
      position,
      snapshot.archived ?? false,
      snapshot.isDone ?? false,
      Column.ensureDate(snapshot.createdAt, 'createdAt'),
      Column.ensureDate(snapshot.updatedAt, 'updatedAt'),
    );
  }

  public static toCommand(input: CreateColumnInput | UpdateColumnInput): ColumnCommand {
    const command: ColumnCommand = {
      title: Column.ensureTitle(input.title),
      position: Column.ensurePosition(input.position),
    };
    if (input.archived !== undefined) {
      command.archived = input.archived;
    }
    if (input.isDone !== undefined) {
      command.isDone = input.isDone;
    }
    return command;
  }

  private static ensureId(id: number): number | void {
    return DomainValidators.positiveInteger(id, 'Column id');
  }

  private static ensureTitle(title: string): string {
    return DomainValidators.requiredString(title, 'Title', 100);
  }

  private static ensurePosition(position: number): number {
    return DomainValidators.nonNegativeInteger(position, 'Position');
  }

  private static ensureDate(raw: string, fieldName: string): Date {
    return DomainValidators.isoDate(raw, fieldName);
  }
}
