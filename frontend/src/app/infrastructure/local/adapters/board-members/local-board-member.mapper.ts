import {
  BoardMember,
  type BoardMemberSnapshot,
} from '../../../../domain/board/entities/board-member.entity';
import type { BoardMemberResponseDto } from '../../../board/dto/board-member.dto';

/**
 * Maps the local (desktop) board member DTO returned by `LocalBackend` into
 * the domain `BoardMember` aggregate, mirroring the HTTP
 * `BoardMemberMapper.toDomain` including the loose role cast.
 */
export class LocalBoardMemberMapper {
  public static toDomain(dto: BoardMemberResponseDto): BoardMember {
    const snapshot: BoardMemberSnapshot = {
      id: dto.id,
      boardId: dto.boardId,
      userId: dto.userId,
      email: dto.email,
      fullName: dto.fullName,
      role: dto.role as BoardMemberSnapshot['role'],
    };
    return BoardMember.fromSnapshot(snapshot);
  }

  public static toDomainMany(dtos: BoardMemberResponseDto[]): BoardMember[] {
    return dtos.map((dto) => LocalBoardMemberMapper.toDomain(dto));
  }
}