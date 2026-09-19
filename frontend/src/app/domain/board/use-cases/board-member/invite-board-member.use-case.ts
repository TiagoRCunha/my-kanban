import { BoardMember, InviteMemberInput } from '../../entities/board-member.entity';
import { BoardMemberRepository } from '../../ports/board-member-repository.port';

export class InviteBoardMemberUseCase {
  public constructor(private readonly boardMemberRepository: BoardMemberRepository) {}

  public execute(boardId: number, input: InviteMemberInput): Promise<BoardMember> {
    return this.boardMemberRepository.inviteMember(boardId, input);
  }
}