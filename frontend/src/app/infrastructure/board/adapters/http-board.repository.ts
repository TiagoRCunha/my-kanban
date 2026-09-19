import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom, map } from 'rxjs';

import {
  Board,
  CreateBoardInput,
  UpdateBoardInput,
} from '../../../domain/board/entities/board.entity';
import { BoardRepository } from '../../../domain/board/ports/board-repository.port';
import { API_BASE_URL } from '../../config/api.config';
import { BoardRequestDto, BoardResponseDto } from '../dto/board.dto';
import { BoardMapper } from '../mappers/board.mapper';

@Injectable({ providedIn: 'root' })
export class HttpBoardRepository implements BoardRepository {
  private readonly httpClient = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  public findAll(): Promise<Board[]> {
    return firstValueFrom(
      this.httpClient
        .get<BoardResponseDto[]>(`${this.apiBaseUrl}/boards`)
        .pipe(map((boards) => boards.map((board) => BoardMapper.toDomain(board)))),
    );
  }

  public findById(id: number): Promise<Board> {
    return firstValueFrom(
      this.httpClient
        .get<BoardResponseDto>(`${this.apiBaseUrl}/boards/${id}`)
        .pipe(map((board) => BoardMapper.toDomain(board))),
    );
  }

  public create(input: CreateBoardInput): Promise<Board> {
    const command = Board.toCommand(input);
    const dto: BoardRequestDto = BoardMapper.toRequestDto(command);

    return firstValueFrom(
      this.httpClient
        .post<BoardResponseDto>(`${this.apiBaseUrl}/boards`, dto)
        .pipe(map((board) => BoardMapper.toDomain(board))),
    );
  }

  public update(id: number, input: UpdateBoardInput): Promise<Board> {
    const command = Board.toCommand(input);
    const dto: BoardRequestDto = BoardMapper.toRequestDto(command);

    return firstValueFrom(
      this.httpClient
        .put<BoardResponseDto>(`${this.apiBaseUrl}/boards/${id}`, dto)
        .pipe(map((board) => BoardMapper.toDomain(board))),
    );
  }

  public delete(id: number): Promise<void> {
    return firstValueFrom(this.httpClient.delete<void>(`${this.apiBaseUrl}/boards/${id}`));
  }

  public leaveBoard(id: number): Promise<void> {
    return firstValueFrom(
      this.httpClient.post<void>(`${this.apiBaseUrl}/boards/${id}/leave`, {}),
    );
  }
}
