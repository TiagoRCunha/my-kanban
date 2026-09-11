import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom, map } from 'rxjs';

import { Column, CreateColumnInput, UpdateColumnInput } from '../../../domain/board/entities/column.entity';
import { API_BASE_URL } from '../../config/api.config';
import { BoardColumnRequestDto, BoardColumnResponseDto } from '../dto/column.dto';
import { ColumnMapper } from '../mappers/column.mapper';

@Injectable({ providedIn: 'root' })
export class HttpColumnRepository {
  private readonly httpClient = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  public findByBoardId(boardId: number): Promise<Column[]> {
    return firstValueFrom(
      this.httpClient
        .get<BoardColumnResponseDto[]>(`${this.apiBaseUrl}/boards/${boardId}/columns`)
        .pipe(map((columns) => columns.map((col) => ColumnMapper.toDomain(col)))),
    );
  }

  public findById(_id: number): Promise<Column> {
    throw new Error('ColumnRepository.findById is not supported by the backend API');
  }

  public create(input: CreateColumnInput & { boardId: number }): Promise<Column> {
    const command = Column.toCommand({
      title: input.title,
      position: input.position,
      archived: input.archived,
      isDone: input.isDone,
    });
    const dto: BoardColumnRequestDto = ColumnMapper.toRequestDto(command);

    return firstValueFrom(
      this.httpClient
        .post<BoardColumnResponseDto>(
          `${this.apiBaseUrl}/boards/${input.boardId}/columns`,
          dto,
        )
        .pipe(map((col) => ColumnMapper.toDomain(col))),
    );
  }

  public update(
    id: number,
    input: UpdateColumnInput & { boardId: number },
  ): Promise<Column> {
    const command = Column.toCommand({
      title: input.title,
      position: input.position,
      archived: input.archived,
      isDone: input.isDone,
    });
    const dto: BoardColumnRequestDto = ColumnMapper.toRequestDto(command);

    return firstValueFrom(
      this.httpClient
        .put<BoardColumnResponseDto>(
          `${this.apiBaseUrl}/boards/${input.boardId}/columns/${id}`,
          dto,
        )
        .pipe(map((col) => ColumnMapper.toDomain(col))),
    );
  }

  public delete(id: number, boardId: number): Promise<void> {
    return firstValueFrom(
      this.httpClient.delete<void>(`${this.apiBaseUrl}/boards/${boardId}/columns/${id}`),
    );
  }

  public reorder(boardId: number, items: { id: number; position: number }[]): Promise<void> {
    return firstValueFrom(
      this.httpClient.patch<void>(
        `${this.apiBaseUrl}/boards/${boardId}/columns/reorder`,
        { items },
      ),
    );
  }
}
