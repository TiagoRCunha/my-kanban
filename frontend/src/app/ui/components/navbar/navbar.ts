import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../infrastructure/auth';
import { ThemeService } from '../../../infrastructure/theme/theme.service';
import { BoardPermissions } from '../../../domain/board/entities/board-permissions';

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

  @Input() boardId: number | null = null;
  @Input() boardOwnerId: number | null = null;
  @Input() permissions: BoardPermissions | null = null;

  @Output() shareBoard = new EventEmitter<void>();

  get userName(): string {
    return this.authService.user?.fullName ?? '';
  }

  get isDarkMode(): boolean {
    return this.themeService.darkMode;
  }

  get isBoardOwner(): boolean {
    const userId = this.authService.user?.id;
    return userId != null && this.boardOwnerId === userId;
  }

  get showShareButton(): boolean {
    if (this.boardId === null) {
      return false;
    }
    return this.permissions?.canManageMembers ?? this.isBoardOwner;
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

  onShare(): void {
    this.shareBoard.emit();
  }
}
