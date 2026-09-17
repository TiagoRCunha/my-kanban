import { BoardMember, BoardMemberRole } from '../../entities/board-member.entity';
import { BoardMemberRepository } from '../../ports/board-member-repository.port';

export class UpdateBoardMemberRoleUseCase {
  public constructor(private readonly boardMemberRepository: BoardMemberRepository) {}

  public execute(boardId: number, memberId: number, role: BoardMemberRole): Promise<BoardMember> {
    return this.boardMemberRepository.updateMemberRole(boardId, memberId, role);
  }
}