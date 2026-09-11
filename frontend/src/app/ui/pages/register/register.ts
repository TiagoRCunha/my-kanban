import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../infrastructure/auth';

@Component({
  selector: 'app-register-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class RegisterPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  fullName = '';
  email = '';
  password = '';
  confirmPassword = '';
  errorMessage = '';
  isLoading = false;

  async onSubmit(): Promise<void> {
    this.errorMessage = '';

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters.';
      return;
    }

    this.isLoading = true;

    try {
      await this.authService.register(this.fullName, this.email, this.password);
      await this.router.navigate([
        '/verify-email',
        { queryParams: { email: this.email, registered: 'true' } },
      ]);
    } catch (error: any) {
      if (error?.status === 409) {
        this.errorMessage = 'An account with this email already exists.';
      } else {
        this.errorMessage = 'Registration failed. Please try again.';
      }
    } finally {
      this.isLoading = false;
    }
  }
}
