import {
  BoardMember,
  BoardMemberSnapshot,
} from '../../../domain/board/entities/board-member.entity';
import {
  BoardMemberResponseDto,
  InviteMemberRequestDto,
} from '../dto/board-member.dto';

export class BoardMemberMapper {
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

  public static toInviteRequestDto(email: string, role: string): InviteMemberRequestDto {
    return { email, role };
  }
}
