import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../infrastructure/auth';

@Component({
  selector: 'app-reset-password-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
})
export class ResetPasswordPage {
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  token = this.route.snapshot.queryParamMap.get('token') ?? '';
  newPassword = '';
  confirmPassword = '';
  errorMessage = '';
  isLoading = false;

  get hasToken(): boolean {
    return this.token.length > 0;
  }

  async onSubmit(): Promise<void> {
    this.errorMessage = '';

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    if (this.newPassword.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters.';
      return;
    }

    this.isLoading = true;

    try {
      await this.authService.resetPassword(this.token, this.newPassword);
      await this.router.navigate(['/login']);
    } catch {
      this.errorMessage = 'This reset link is invalid or has expired.';
    } finally {
      this.isLoading = false;
    }
  }
}
