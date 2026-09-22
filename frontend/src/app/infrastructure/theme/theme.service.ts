import { Injectable, inject } from '@angular/core';

import { USER_CONFIG_REPOSITORY } from '../di/repository-tokens';

const DARK_MODE_KEY = 'mykanban_dark_mode';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly userConfigRepository = inject(USER_CONFIG_REPOSITORY);

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

    // Fire and forget: the optimisation must never block the UI, exactly like
    // the original HTTP call that swallowed its own errors.
    this.userConfigRepository
      .updateDarkMode(userId, this.isDarkMode)
      .catch(() => {});
  }

  async loadFromBackend(userId: number): Promise<void> {
    try {
      const config = await this.userConfigRepository.getConfig(userId);
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
