import { BoardMemberRepository } from '../../ports/board-member-repository.port';

export class RemoveBoardMemberUseCase {
  public constructor(private readonly boardMemberRepository: BoardMemberRepository) {}

  public execute(boardId: number, memberId: number): Promise<void> {
    return this.boardMemberRepository.removeMember(boardId, memberId);
  }
}