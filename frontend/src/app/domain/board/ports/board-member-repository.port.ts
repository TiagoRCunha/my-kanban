import {
  BoardMember,
  BoardMemberRole,
  InviteMemberInput,
} from '../entities/board-member.entity';

/**
 * Port for board member operations. Board-scoped (unlike the generic
 * {@code Repository}), because members are always accessed through a board.
 */
export interface BoardMemberRepository {
  listMembers(boardId: number): Promise<BoardMember[]>;
  inviteMember(boardId: number, input: InviteMemberInput): Promise<BoardMember>;
  updateMemberRole(boardId: number, memberId: number, role: BoardMemberRole): Promise<BoardMember>;
  removeMember(boardId: number, memberId: number): Promise<void>;
}