import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../infrastructure/auth';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  errorMessage = '';
  isLoading = false;
  needsVerification = false;

  get verifyEmailLink(): string {
    return `/verify-email?email=${encodeURIComponent(this.email)}`;
  }

  async onSubmit(): Promise<void> {
    this.errorMessage = '';
    this.needsVerification = false;
    this.isLoading = true;

    try {
      await this.authService.login(this.email, this.password);
      await this.router.navigate(['/boards']);
    } catch (error: any) {
      if (error?.status === 403) {
        this.needsVerification = true;
        this.errorMessage = 'Please verify your email before signing in.';
      } else {
        this.errorMessage = 'Invalid email or password. Please try again.';
      }
    } finally {
      this.isLoading = false;
    }
  }
}
