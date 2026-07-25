import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../infrastructure/auth';
import { ThemeService } from '../../../infrastructure/theme/theme.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly themeService = inject(ThemeService);

  get userName(): string {
    return this.authService.user?.fullName ?? '';
  }

  get isDarkMode(): boolean {
    return this.themeService.darkMode;
  }

  get themeIcon(): string {
    return this.themeService.darkMode ? '🌙' : '☀';
  }

  async onToggleDarkMode(): Promise<void> {
    const userId = this.authService.user?.id;
    if (userId) {
      await this.themeService.toggleDarkMode(userId);
    }
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
