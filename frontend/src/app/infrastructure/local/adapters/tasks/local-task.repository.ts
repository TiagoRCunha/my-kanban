import type { LocalActorPort } from '../../../../domain/shared/ports/local-actor.port';
import type { LocalBackend } from '../../local-backend';
import {
  Task,
  type CreateTaskInput,
  type UpdateTaskInput,
} from '../../../../domain/board/entities/task.entity';
import { LocalTaskMapper } from './local-task.mapper';

/**
 * Local (desktop) adapter for tasks, backed by `LocalBackend`. Every call
 * resolves the acting user id from the given `LocalActorPort`, mirroring how
 * the JWT carries identity for the HTTP adapters. Mirrors the
 * `HttpTaskRepository` veneer contract (column-scoped, no standalone
 * `findById`). The reporter of a new task is always the acting user.
 */
export class LocalTaskRepository {
  constructor(
    private readonly backend: LocalBackend,
    private readonly actor: LocalActorPort,
  ) {}

  public async findByColumnId(columnId: number): Promise<Task[]> {
    const actorId = await this.actor.resolveActorId();
    return LocalTaskMapper.toDomainMany(await this.backend.listTasks(actorId, columnId));
  }

  public async findById(_id: number): Promise<Task> {
    throw new Error('TaskRepository.findById is not supported by the backend API');
  }

  public async create(input: CreateTaskInput): Promise<Task> {
    const actorId = await this.actor.resolveActorId();
    return LocalTaskMapper.toDomain(
      await this.backend.createTask(actorId, input.columnId, {
        title: input.title,
        description: input.description ?? null,
        tagId: input.tagId,
        dueDate: input.dueDate ?? null,
        estimatedHours: input.estimatedHours ?? null,
        position: input.position,
        assigneeIds: input.assigneeIds,
      }),
    );
  }

  public async update(id: number, input: UpdateTaskInput & { columnId: number }): Promise<Task> {
    const actorId = await this.actor.resolveActorId();
    return LocalTaskMapper.toDomain(
      await this.backend.updateTask(actorId, input.columnId, id, {
        title: input.title,
        description: input.description ?? null,
        tagId: input.tagId,
        dueDate: input.dueDate ?? null,
        estimatedHours: input.estimatedHours ?? null,
        position: input.position,
        assigneeIds: input.assigneeIds,
      }),
    );
  }

  public async delete(id: number, columnId: number): Promise<void> {
    const actorId = await this.actor.resolveActorId();
    await this.backend.deleteTask(actorId, columnId, id);
  }

  public async reorder(
    columnId: number,
    items: { id: number; position: number }[],
  ): Promise<void> {
    const actorId = await this.actor.resolveActorId();
    await this.backend.reorderTasks(actorId, columnId, items);
  }

  public async moveTask(
    taskId: number,
    _sourceColumnId: number,
    targetColumnId: number,
    position: number,
    reorderedSourceTasks: { id: number; position: number }[] | null,
    reorderedTargetTasks: { id: number; position: number }[],
  ): Promise<void> {
    const actorId = await this.actor.resolveActorId();
    await this.backend.moveTask(actorId, taskId, {
      targetColumnId,
      position,
      reorderedSourceTasks,
      reorderedTargetTasks,
    });
  }

  public async markAsDone(taskId: number, _columnId: number): Promise<Task> {
    const actorId = await this.actor.resolveActorId();
    return LocalTaskMapper.toDomain(await this.backend.markTaskAsDone(actorId, taskId));
  }
}