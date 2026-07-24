import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../infrastructure/auth';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  get userName(): string {
    return this.authService.user?.fullName ?? '';
  }

  onToggleDarkMode(): void {
    // TODO: dark mode implementation
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
