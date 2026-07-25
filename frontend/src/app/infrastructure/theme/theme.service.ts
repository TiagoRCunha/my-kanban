import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';

const DARK_MODE_KEY = 'mykanban_dark_mode';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly httpClient = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  private isDarkMode = false;

  constructor() {
    const stored = localStorage.getItem(DARK_MODE_KEY);
    if (stored !== null) {
      this.isDarkMode = JSON.parse(stored);
    }
    this.applyTheme();
  }

  get darkMode(): boolean {
    return this.isDarkMode;
  }

  async toggleDarkMode(userId: number): Promise<void> {
    this.isDarkMode = !this.isDarkMode;
    this.applyTheme();
    localStorage.setItem(DARK_MODE_KEY, JSON.stringify(this.isDarkMode));

    firstValueFrom(
      this.httpClient.put(`${this.apiBaseUrl}/users/${userId}/config`, {
        darkMode: this.isDarkMode,
      }),
    ).catch(() => {});
  }

  async loadFromBackend(userId: number): Promise<void> {
    try {
      const config = await firstValueFrom(
        this.httpClient.get<{ darkMode: boolean }>(
          `${this.apiBaseUrl}/users/${userId}/config`,
        ),
      );
      this.isDarkMode = config.darkMode;
      this.applyTheme();
      localStorage.setItem(DARK_MODE_KEY, JSON.stringify(this.isDarkMode));
    } catch {
      // Keep localStorage value if backend is unreachable
    }
  }

  private applyTheme(): void {
    document.documentElement.setAttribute(
      'data-theme',
      this.isDarkMode ? 'dark' : 'light',
    );
  }
}
