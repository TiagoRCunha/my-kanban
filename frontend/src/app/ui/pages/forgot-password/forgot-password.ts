import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../infrastructure/auth';

@Component({
  selector: 'app-forgot-password-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
})
export class ForgotPasswordPage {
  private readonly authService = inject(AuthService);

  email = '';
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  async onSubmit(): Promise<void> {
    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = true;

    try {
      await this.authService.forgotPassword(this.email);
      this.successMessage =
        'If an account exists for this email, a password reset link has been sent.';
    } catch {
      this.errorMessage = 'Something went wrong. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }
}
