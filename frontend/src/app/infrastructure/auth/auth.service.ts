import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { ThemeService } from '../theme/theme.service';
import { AuthLoginRequestDto } from './dto/auth-login-request.dto';
import { AuthRegisterRequestDto } from './dto/auth-register-request.dto';
import { AuthTokenResponseDto } from './dto/auth-token-response.dto';
import { AuthUserResponseDto } from './dto/auth-user-response.dto';
import { ChangePasswordRequestDto } from './dto/change-password-request.dto';
import { ForgotPasswordRequestDto } from './dto/forgot-password-request.dto';
import { ResendVerificationRequestDto } from './dto/resend-verification-request.dto';
import { ResetPasswordRequestDto } from './dto/reset-password-request.dto';
import { VerifyEmailRequestDto } from './dto/verify-email-request.dto';

export type AuthUser = {
  id: number;
  fullName: string;
  email: string;
  avatarUrl: string | null;
};

const TOKEN_KEY = 'mykanban_access_token';
const USER_KEY = 'mykanban_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly httpClient = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly themeService = inject(ThemeService);

  private currentUser: AuthUser | null = this.loadStoredUser();

  get user(): AuthUser | null {
    return this.currentUser;
  }

  get isAuthenticated(): boolean {
    return this.currentUser !== null && this.getToken() !== null;
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  async login(email: string, password: string): Promise<AuthUser> {
    const body: AuthLoginRequestDto = { email, password };

    const tokenResponse = await firstValueFrom(
      this.httpClient.post<AuthTokenResponseDto>(`${this.apiBaseUrl}/auth/login`, body),
    );

    this.storeToken(tokenResponse.accessToken);

    const user = await this.fetchCurrentUser();
    this.storeUser(user);
    this.currentUser = user;

    this.themeService.loadFromBackend(user.id);

    return user;
  }

  async register(fullName: string, email: string, password: string): Promise<AuthUser> {
    const body: AuthRegisterRequestDto = { fullName, email, password };

    const userDto = await firstValueFrom(
      this.httpClient.post<AuthUserResponseDto>(`${this.apiBaseUrl}/auth/register`, body),
    );

    const user: AuthUser = {
      id: userDto.id,
      fullName: userDto.fullName,
      email: userDto.email,
      avatarUrl: userDto.avatarUrl,
    };

    return user;
  }

  async verifyEmail(token: string): Promise<void> {
    const body: VerifyEmailRequestDto = { token };
    await firstValueFrom(
      this.httpClient.post(`${this.apiBaseUrl}/auth/verify-email`, body),
    );
  }

  async resendVerification(email: string): Promise<void> {
    const body: ResendVerificationRequestDto = { email };
    await firstValueFrom(
      this.httpClient.post(`${this.apiBaseUrl}/auth/resend-verification`, body),
    );
  }

  async forgotPassword(email: string): Promise<void> {
    const body: ForgotPasswordRequestDto = { email };
    await firstValueFrom(
      this.httpClient.post(`${this.apiBaseUrl}/auth/forgot-password`, body),
    );
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const body: ResetPasswordRequestDto = { token, newPassword };
    await firstValueFrom(
      this.httpClient.post(`${this.apiBaseUrl}/auth/reset-password`, body),
    );
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const body: ChangePasswordRequestDto = { currentPassword, newPassword };
    await firstValueFrom(
      this.httpClient.put(`${this.apiBaseUrl}/auth/password`, body),
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUser = null;
  }

  private async fetchCurrentUser(): Promise<AuthUser> {
    const payload = this.decodeTokenPayload(this.getToken()!);

    const userDto = await firstValueFrom(
      this.httpClient.get<AuthUserResponseDto>(`${this.apiBaseUrl}/users/${payload.uid}`),
    );

    return {
      id: userDto.id,
      fullName: userDto.fullName,
      email: userDto.email,
      avatarUrl: userDto.avatarUrl,
    };
  }

  private decodeTokenPayload(token: string): { sub: string; uid: number } {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return { sub: decoded.sub, uid: decoded.uid };
  }

  private storeToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  private storeUser(user: AuthUser): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  private loadStoredUser(): AuthUser | null {
    const token = localStorage.getItem(TOKEN_KEY);
    const userJson = localStorage.getItem(USER_KEY);

    if (!token || !userJson) {
      return null;
    }

    try {
      return JSON.parse(userJson) as AuthUser;
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      return null;
    }
  }
}
