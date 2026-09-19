import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom, map } from 'rxjs';

import {
  BoardMember,
  BoardMemberRole,
  InviteMemberInput,
} from '../../../domain/board/entities/board-member.entity';
import { BoardMemberRepository } from '../../../domain/board/ports/board-member-repository.port';
import { API_BASE_URL } from '../../config/api.config';
import {
  BoardMemberResponseDto,
  InviteMemberRequestDto,
  UpdateMemberRoleRequestDto,
} from '../dto/board-member.dto';
import { BoardMemberMapper } from '../mappers/board-member.mapper';

@Injectable({ providedIn: 'root' })
export class HttpBoardMemberRepository implements BoardMemberRepository {
  private readonly httpClient = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  public listMembers(boardId: number): Promise<BoardMember[]> {
    return firstValueFrom(
      this.httpClient
        .get<BoardMemberResponseDto[]>(`${this.apiBaseUrl}/boards/${boardId}/members`)
        .pipe(map((members) => members.map((m) => BoardMemberMapper.toDomain(m)))),
    );
  }

  public inviteMember(boardId: number, input: InviteMemberInput): Promise<BoardMember> {
    const dto: InviteMemberRequestDto = BoardMemberMapper.toInviteRequestDto(
      input.email,
      input.role,
    );

    return firstValueFrom(
      this.httpClient
        .post<BoardMemberResponseDto>(`${this.apiBaseUrl}/boards/${boardId}/members`, dto)
        .pipe(map((m) => BoardMemberMapper.toDomain(m))),
    );
  }

  public updateMemberRole(boardId: number, memberId: number, role: BoardMemberRole): Promise<BoardMember> {
    const dto: UpdateMemberRoleRequestDto = { role };

    return firstValueFrom(
      this.httpClient
        .put<BoardMemberResponseDto>(
          `${this.apiBaseUrl}/boards/${boardId}/members/${memberId}`,
          dto,
        )
        .pipe(map((m) => BoardMemberMapper.toDomain(m))),
    );
  }

  public removeMember(boardId: number, memberId: number): Promise<void> {
    return firstValueFrom(
      this.httpClient.delete<void>(`${this.apiBaseUrl}/boards/${boardId}/members/${memberId}`),
    );
  }
}
