import { DomainValidators } from "../../shared/domain-validators";

export type ColumnSnapshot = {
  id: number;
  title: string;
  position: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateColumnInput = {
  title: string;
  position: number;
};

export type UpdateColumnInput = {
  title: string;
  position: number;
};

export type ColumnCommand = {
  title: string;
  position: number;
};

export class Column {
  private constructor(
    public readonly id: number,
    public readonly title: string,
    public readonly position: number,
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
      Column.ensureDate(snapshot.createdAt, 'createdAt'),
      Column.ensureDate(snapshot.updatedAt, 'updatedAt'),
    );
  }

  public static toCommand(input: CreateColumnInput | UpdateColumnInput): ColumnCommand {
    return {
      title: Column.ensureTitle(input.title),
      position: Column.ensurePosition(input.position),
    };
  }

  private static ensureId(id: number): number | void {
    return DomainValidators.positiveInteger(id, 'Column id');
  }

  private static ensureTitle(title: string): string {
    return DomainValidators.requiredString(title, 'Title', 100);
  }

  private static ensurePosition(position: number): number {
    return DomainValidators.positiveInteger(position, 'Position');
  }

  private static ensureDate(raw: string, fieldName: string): Date {
    return DomainValidators.isoDate(raw, fieldName);
  }
}
