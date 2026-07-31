import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../config/api.config';
import { CustomTag } from '../../../domain/board/entities/task.entity';
import { BoardColumnResponseDto } from '../../board/dto/column.dto';
import {
  CustomTagResponseDto,
  SaveCustomTagRequestDto,
  SaveStartupColumnRequestDto,
  StartupColumnResponseDto,
  UserConfigResponseDto,
} from '../dto/user-config.dto';

@Injectable({ providedIn: 'root' })
export class HttpUserConfigRepository {
  private readonly httpClient = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  async getConfig(userId: number): Promise<UserConfigResponseDto> {
    return firstValueFrom(
      this.httpClient.get<UserConfigResponseDto>(
        `${this.apiBaseUrl}/users/${userId}/config`,
      ),
    );
  }

  async getCustomTags(userId: number): Promise<CustomTag[]> {
    const dtos = await firstValueFrom(
      this.httpClient.get<CustomTagResponseDto[]>(
        `${this.apiBaseUrl}/users/${userId}/config/custom-tags`,
      ),
    );
    return dtos.map((dto) => ({ id: dto.id, name: dto.name, color: dto.color }));
  }

  async getStartupColumns(userId: number): Promise<StartupColumnResponseDto[]> {
    return firstValueFrom(
      this.httpClient.get<StartupColumnResponseDto[]>(
        `${this.apiBaseUrl}/users/${userId}/config/startup-columns`,
      ),
    );
  }

  async updateDarkMode(userId: number, darkMode: boolean): Promise<void> {
    await firstValueFrom(
      this.httpClient.patch(`${this.apiBaseUrl}/users/${userId}/config`, {
        darkMode,
      }),
    );
  }

  async saveStartupColumns(
    userId: number,
    columns: SaveStartupColumnRequestDto[],
  ): Promise<StartupColumnResponseDto[]> {
    return firstValueFrom(
      this.httpClient.put<StartupColumnResponseDto[]>(
        `${this.apiBaseUrl}/users/${userId}/config/startup-columns`,
        { columns },
      ),
    );
  }

  async getDoneColumn(boardId: number): Promise<{ id: number } | null> {
    const columns = await firstValueFrom(
      this.httpClient.get<BoardColumnResponseDto[]>(
        `${this.apiBaseUrl}/boards/${boardId}/columns`,
      ),
    );
    return columns.find((col) => col.isDone) ?? null;
  }

  async createCustomTag(
    userId: number,
    tag: SaveCustomTagRequestDto,
  ): Promise<CustomTagResponseDto> {
    return firstValueFrom(
      this.httpClient.post<CustomTagResponseDto>(
        `${this.apiBaseUrl}/users/${userId}/config/custom-tags`,
        tag,
      ),
    );
  }

  async updateCustomTag(
    userId: number,
    tagId: number,
    tag: SaveCustomTagRequestDto,
  ): Promise<CustomTagResponseDto> {
    return firstValueFrom(
      this.httpClient.put<CustomTagResponseDto>(
        `${this.apiBaseUrl}/users/${userId}/config/custom-tags/${tagId}`,
        tag,
      ),
    );
  }

  async deleteCustomTag(userId: number, tagId: number): Promise<void> {
    await firstValueFrom(
      this.httpClient.delete(
        `${this.apiBaseUrl}/users/${userId}/config/custom-tags/${tagId}`,
      ),
    );
  }
}
