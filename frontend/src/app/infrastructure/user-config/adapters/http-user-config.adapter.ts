import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom, map } from 'rxjs';

import { UserConfigRepositoryPort } from '../../../domain/users/ports/user-config-repository.port';
import { UserConfigSnapshot } from '../../../domain/users/entities/user-config.entity';
import { CustomTagSettingsCommand } from '../../../domain/users/entities/custom-tag-settings.entity';
import { StartupColumnCommand } from '../../../domain/users/entities/startup-column.entity';
import { API_BASE_URL } from '../../config/api.config';
import { UserConfigResponseDto } from '../dto/user-config.dto';
import { UserConfigMapper } from '../mappers/user-config.mapper';

@Injectable({ providedIn: 'root' })
export class HttpUserConfigAdapter implements UserConfigRepositoryPort {
  private readonly httpClient = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  async getConfig(userId: number): Promise<UserConfigSnapshot> {
    return firstValueFrom(
      this.httpClient
        .get<UserConfigResponseDto>(`${this.apiBaseUrl}/users/${userId}/config`)
        .pipe(map((dto) => UserConfigMapper.toSnapshot(dto))),
    );
  }

  async updateDarkMode(userId: number, darkMode: boolean): Promise<void> {
    await firstValueFrom(
      this.httpClient.put(`${this.apiBaseUrl}/users/${userId}/config`, { darkMode }),
    );
  }

  async updateConfig(userId: number, config: { darkMode?: boolean; defaultTaskLimit?: number }): Promise<void> {
    await firstValueFrom(
      this.httpClient.put(`${this.apiBaseUrl}/users/${userId}/config`, config),
    );
  }

  async saveStartupColumns(
    userId: number,
    columns: StartupColumnCommand[],
  ): Promise<{ id: number; title: string; position: number; type: string }[]> {
    return firstValueFrom(
      this.httpClient.put<{ id: number; title: string; position: number; type: string }[]>(
        `${this.apiBaseUrl}/users/${userId}/config/startup-columns`,
        { columns },
      ),
    );
  }

  async createCustomTag(
    userId: number,
    tag: CustomTagSettingsCommand,
  ): Promise<{ id: number; name: string; color: string; position: number }> {
    return firstValueFrom(
      this.httpClient.post<{ id: number; name: string; color: string; position: number }>(
        `${this.apiBaseUrl}/users/${userId}/config/custom-tags`,
        tag,
      ),
    );
  }

  async updateCustomTag(
    userId: number,
    tagId: number,
    tag: CustomTagSettingsCommand,
  ): Promise<{ id: number; name: string; color: string; position: number }> {
    return firstValueFrom(
      this.httpClient.put<{ id: number; name: string; color: string; position: number }>(
        `${this.apiBaseUrl}/users/${userId}/config/custom-tags/${tagId}`,
        tag,
      ),
    );
  }

  async deleteCustomTag(userId: number, tagId: number): Promise<void> {
    await firstValueFrom(
      this.httpClient.delete(`${this.apiBaseUrl}/users/${userId}/config/custom-tags/${tagId}`),
    );
  }
}
