export type BoardMemberRole = 'INVITED' | 'VIEW_ONLY' | 'OWNER' | 'GUEST';

export type BoardMemberSnapshot = {
  id: number;
  boardId: number;
  userId: number;
  email: string;
  fullName: string;
  role: BoardMemberRole;
};

export type InviteMemberInput = {
  email: string;
  role: BoardMemberRole;
};

export type UpdateMemberRoleInput = {
  role: BoardMemberRole;
};

export class BoardMember {
  private constructor(
    public readonly id: number,
    public readonly boardId: number,
    public readonly userId: number,
    public readonly email: string,
    public readonly fullName: string,
    public readonly role: BoardMemberRole,
  ) {}

  public static fromSnapshot(snapshot: BoardMemberSnapshot): BoardMember {
    return new BoardMember(
      snapshot.id,
      snapshot.boardId,
      snapshot.userId,
      snapshot.email,
      snapshot.fullName,
      snapshot.role,
    );
  }

  get isPending(): boolean {
    return this.role === 'INVITED';
  }

  get displayRole(): string {
    switch (this.role) {
      case 'OWNER':
        return 'Owner';
      case 'GUEST':
        return 'Guest';
      case 'VIEW_ONLY':
        return 'View Only';
      case 'INVITED':
        return 'Pending Invite';
      default:
        return this.role;
    }
  }
}
