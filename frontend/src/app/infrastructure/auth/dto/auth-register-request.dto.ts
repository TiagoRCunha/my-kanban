export type AuthRegisterRequestDto = {
  fullName: string;
  email: string;
  password: string;
  avatarUrl?: string | null;
};
