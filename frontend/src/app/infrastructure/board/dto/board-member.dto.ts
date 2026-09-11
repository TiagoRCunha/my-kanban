export type BoardMemberResponseDto = {
  id: number;
  boardId: number;
  userId: number;
  email: string;
  fullName: string;
  role: string;
};

export type InviteMemberRequestDto = {
  email: string;
  role: string;
};

export type UpdateMemberRoleRequestDto = {
  role: string;
};
