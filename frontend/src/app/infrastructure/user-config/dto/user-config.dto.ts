export type CustomTagResponseDto = {
  id: number;
  name: string;
  color: string;
  position: number;
};

export type StartupColumnResponseDto = {
  id: number;
  title: string;
  position: number;
};

export type UserConfigResponseDto = {
  id: number;
  userId: number;
  darkMode: boolean;
  startupColumns: StartupColumnResponseDto[];
  customTags: CustomTagResponseDto[];
  createdAt: string;
  updatedAt: string;
};

export type SaveStartupColumnRequestDto = {
  title: string;
  position: number;
};

export type SaveCustomTagRequestDto = {
  name: string;
  color: string;
  position: number;
};
