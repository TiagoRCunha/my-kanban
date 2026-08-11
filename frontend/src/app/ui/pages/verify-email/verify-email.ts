import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../infrastructure/auth';

@Component({
  selector: 'app-verify-email-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.scss',
})
export class VerifyEmailPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  token = this.route.snapshot.queryParamMap.get('token') ?? '';
  email = this.route.snapshot.queryParamMap.get('email') ?? '';
  justRegistered = this.route.snapshot.queryParamMap.get('registered') === 'true';

  status: 'verifying' | 'verified' | 'failed' | 'idle' = this.token ? 'verifying' : 'idle';
  errorMessage = '';
  resendMessage = '';
  isResending = false;

  async ngOnInit(): Promise<void> {
    if (this.token) {
      await this.verify();
    }
  }

  async verify(): Promise<void> {
    this.status = 'verifying';
    this.errorMessage = '';

    try {
      await this.authService.verifyEmail(this.token);
      this.status = 'verified';
    } catch {
      this.status = 'failed';
      this.errorMessage = 'This verification link is invalid or has expired.';
    }
  }

  async resend(): Promise<void> {
    this.resendMessage = '';
    this.errorMessage = '';

    if (!this.email) {
      this.errorMessage = 'Enter your email address first.';
      return;
    }

    this.isResending = true;

    try {
      await this.authService.resendVerification(this.email);
      this.resendMessage = 'A new verification email has been sent. Check your inbox.';
    } catch {
      this.errorMessage = 'Failed to resend the verification email. Please try again.';
    } finally {
      this.isResending = false;
    }
  }
}
