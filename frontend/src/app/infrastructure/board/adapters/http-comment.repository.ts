import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom, map } from 'rxjs';

import { Comment, CreateCommentInput, UpdateCommentInput } from '../../../domain/board/entities/comment.entity';
import { API_BASE_URL } from '../../config/api.config';
import { CommentRequestDto, CommentResponseDto } from '../dto/comment.dto';
import { CommentMapper } from '../mappers/comment.mapper';

@Injectable({ providedIn: 'root' })
export class HttpCommentRepository {
  private readonly httpClient = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  public findByTaskId(taskId: number): Promise<Comment[]> {
    return firstValueFrom(
      this.httpClient
        .get<CommentResponseDto[]>(`${this.apiBaseUrl}/tasks/${taskId}/comments`)
        .pipe(map((comments) => comments.map((c) => CommentMapper.toDomain(c)))),
    );
  }

  public findById(_id: number): Promise<Comment> {
    throw new Error('CommentRepository.findById is not supported by the backend API');
  }

  public create(input: CreateCommentInput): Promise<Comment> {
    const command = Comment.toCommand(input);
    const dto: CommentRequestDto = CommentMapper.toRequestDto(command);

    return firstValueFrom(
      this.httpClient
        .post<CommentResponseDto>(
          `${this.apiBaseUrl}/tasks/${input.taskId}/comments`,
          dto,
        )
        .pipe(map((c) => CommentMapper.toDomain(c))),
    );
  }

  public update(
    id: number,
    input: UpdateCommentInput,
  ): Promise<Comment> {
    const command = Comment.toCommand(input);
    const dto: CommentRequestDto = CommentMapper.toRequestDto(command);

    return firstValueFrom(
      this.httpClient
        .put<CommentResponseDto>(
          `${this.apiBaseUrl}/tasks/${input.taskId}/comments/${id}`,
          dto,
        )
        .pipe(map((c) => CommentMapper.toDomain(c))),
    );
  }

  public delete(id: number, taskId: number): Promise<void> {
    return firstValueFrom(
      this.httpClient.delete<void>(`${this.apiBaseUrl}/tasks/${taskId}/comments/${id}`),
    );
  }
}
