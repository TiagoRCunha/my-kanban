import { BoardMember } from '../../entities/board-member.entity';
import { BoardMemberRepository } from '../../ports/board-member-repository.port';

export class ListBoardMembersUseCase {
  public constructor(private readonly boardMemberRepository: BoardMemberRepository) {}

  public execute(boardId: number): Promise<BoardMember[]> {
    return this.boardMemberRepository.listMembers(boardId);
  }
}