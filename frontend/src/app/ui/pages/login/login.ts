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

  async onSubmit(): Promise<void> {
    this.errorMessage = '';
    this.isLoading = true;

    try {
      await this.authService.login(this.email, this.password);
      await this.router.navigate(['/boards']);
    } catch (error) {
      this.errorMessage = 'Invalid email or password. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }
}
