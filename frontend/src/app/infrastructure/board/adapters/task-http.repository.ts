import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom, map } from 'rxjs';

import { Task, CreateTaskInput, UpdateTaskInput } from '../../../domain/board/entities/task.entity';
import { API_BASE_URL } from '../../config/api.config';
import { TaskRequestDto, TaskResponseDto } from '../dto/task.dto';
import { TaskMapper } from '../mappers/task.mapper';

@Injectable({ providedIn: 'root' })
export class HttpTaskRepository {
  private readonly httpClient = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  public findByColumnId(columnId: number): Promise<Task[]> {
    return firstValueFrom(
      this.httpClient
        .get<TaskResponseDto[]>(`${this.apiBaseUrl}/columns/${columnId}/tasks`)
        .pipe(map((tasks) => tasks.map((task) => TaskMapper.toDomain(task)))),
    );
  }

  public findById(_id: number): Promise<Task> {
    throw new Error('TaskRepository.findById is not supported by the backend API');
  }

  public create(input: CreateTaskInput): Promise<Task> {
    const command = Task.toCommand(input);
    const dto: TaskRequestDto = TaskMapper.toRequestDto(command);

    return firstValueFrom(
      this.httpClient
        .post<TaskResponseDto>(
          `${this.apiBaseUrl}/columns/${input.columnId}/tasks`,
          dto,
        )
        .pipe(map((task) => TaskMapper.toDomain(task))),
    );
  }

  public update(id: number, input: UpdateTaskInput & { columnId: number }): Promise<Task> {
    const command = Task.toCommand(input);
    const dto: TaskRequestDto = TaskMapper.toRequestDto(command);

    return firstValueFrom(
      this.httpClient
        .put<TaskResponseDto>(
          `${this.apiBaseUrl}/columns/${input.columnId}/tasks/${id}`,
          dto,
        )
        .pipe(map((task) => TaskMapper.toDomain(task))),
    );
  }

  public delete(id: number, columnId: number): Promise<void> {
    return firstValueFrom(
      this.httpClient.delete<void>(`${this.apiBaseUrl}/columns/${columnId}/tasks/${id}`),
    );
  }

  public reorder(columnId: number, items: { id: number; position: number }[]): Promise<void> {
    return firstValueFrom(
      this.httpClient.patch<void>(
        `${this.apiBaseUrl}/columns/${columnId}/tasks/reorder`,
        { items },
      ),
    );
  }

  public moveTask(
    taskId: number,
    sourceColumnId: number,
    targetColumnId: number,
    position: number,
    reorderedSourceTasks: { id: number; position: number }[] | null,
    reorderedTargetTasks: { id: number; position: number }[],
  ): Promise<void> {
    return firstValueFrom(
      this.httpClient.patch<void>(
        `${this.apiBaseUrl}/columns/${sourceColumnId}/tasks/${taskId}/move`,
        {
          targetColumnId,
          position,
          reorderedSourceTasks,
          reorderedTargetTasks,
        },
      ),
    );
  }
}
