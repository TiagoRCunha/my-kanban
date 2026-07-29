import { DomainValidators } from "../../shared/domain-validators";

export type CustomTag = {
  id: number;
  name: string;
  color: string;
};

export type TaskSnapshot = {
  id: number;
  title: string;
  description: string | null;
  tagId: number | null;
  tagName: string | null;
  tagColor: string | null;
  dueDate: string | null;
  estimatedHours: number | null;
  position: number;
  reportedById: number;
  columnId: number;
  assigneeIds: number[];
  createdAt: string;
  updatedAt: string;
};

export type CreateTaskInput = {
  title: string;
  description?: string | null;
  tagId: number | null;
  dueDate?: string | null;
  estimatedHours?: number | null;
  position: number;
  reportedById: number;
  columnId: number;
  assigneeIds: number[];
};

export type UpdateTaskInput = {
  title: string;
  description?: string | null;
  tagId: number | null;
  dueDate?: string | null;
  estimatedHours?: number | null;
  position: number;
  reportedById: number;
  assigneeIds: number[];
};

export type TaskCommand = {
  title: string;
  description: string;
  tagId: number | null;
  dueDate: string;
  estimatedHours: number;
  position: number;
  reportedById: number;
  assigneeIds: number[];
};

export class Task {
  private constructor(
    public readonly id: number,
    public readonly title: string,
    public readonly description: string,
    public readonly tagId: number | null,
    public readonly tagName: string,
    public readonly tagColor: string,
    public readonly dueDate: string,
    public readonly estimatedHours: number,
    public readonly position: number,
    public readonly reportedById: number,
    public readonly assigneeIds: number[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) { }

  public static fromSnapshot(snapshot: TaskSnapshot): Task {
    Task.ensureId(snapshot.id);
    const title = Task.ensureTitle(snapshot.title);
    const position = Task.ensurePosition(snapshot.position);

    return new Task(
      snapshot.id,
      title,
      snapshot.description?.trim() ?? '',
      snapshot.tagId ?? null,
      snapshot.tagName?.trim() ?? '',
      snapshot.tagColor?.trim() ?? '',
      snapshot.dueDate?.trim() ?? '',
      snapshot.estimatedHours ?? 0,
      position,
      snapshot.reportedById,
      snapshot.assigneeIds,
      Task.ensureDate(snapshot.createdAt, 'createdAt'),
      Task.ensureDate(snapshot.updatedAt, 'updatedAt'),
    );
  }

  public static toCommand(input: CreateTaskInput | UpdateTaskInput): TaskCommand {
    return {
      title: Task.ensureTitle(input.title),
      description: input.description?.trim() ?? '',
      tagId: input.tagId ?? null,
      dueDate: Task.ensureDueDate(input.dueDate),
      estimatedHours: Task.ensureEstimatedHours(input.estimatedHours),
      position: Task.ensurePosition(input.position),
      reportedById: Task.ensureReportedById(input.reportedById),
      assigneeIds: Task.ensureAssigneeIds(input.assigneeIds),
    };
  }

  private static ensureId(id: number): number | void {
    return DomainValidators.positiveInteger(id, 'Task id');
  }

  private static ensureTitle(title: string): string {
    return DomainValidators.requiredString(title, 'Task title', 100);
  }

  private static ensureDueDate(dueDate: string | null | undefined): string {
    return dueDate?.trim() ?? '';
  }

  private static ensureEstimatedHours(estimatedHours: number | null | undefined): number {
    return estimatedHours ?? 0;
  }

  private static ensurePosition(position: number): number {
    return DomainValidators.nonNegativeInteger(position, 'Task position');
  }

  private static ensureAssigneeIds(assigneeIds: number[]): number[] {
    return DomainValidators.positiveIntegerArray(assigneeIds, 'Task assigneeIds');
  }

  private static ensureReportedById(reportedById: number): number {
    return DomainValidators.positiveInteger(reportedById, 'Task reportedById');
  }

  private static ensureDate(raw: string, fieldName: string): Date {
    return DomainValidators.isoDate(raw, fieldName);
  }
}
