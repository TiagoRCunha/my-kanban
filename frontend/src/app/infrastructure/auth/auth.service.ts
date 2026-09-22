import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { ThemeService } from '../theme/theme.service';
import {
  LOCAL_BACKEND,
  LOCAL_DATABASE,
  LOCAL_SESSION_STORE,
} from '../local/di/local-veneer.providers';
import { detectStorageMode } from '../local/storage/storage-driver.factory';
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
  role: string;
};

const TOKEN_KEY = 'mykanban_access_token';
const USER_KEY = 'mykanban_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly httpClient = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly themeService = inject(ThemeService);

  // Local (desktop) veneer pieces. They are only present when the app was
  // bootstrapped through `provideRepositoryVeneer('desktop')`, so optional
  // injection keeps the web application on the JWT-only code path.
  private readonly sessionStore = inject(LOCAL_SESSION_STORE, { optional: true }) ?? null;
  private readonly localDatabase = inject(LOCAL_DATABASE, { optional: true }) ?? null;
  private readonly localBackend = inject(LOCAL_BACKEND, { optional: true }) ?? null;

  private currentUser: AuthUser | null = this.loadStoredUser();

  private get isDesktopMode(): boolean {
    return this.sessionStore !== null && detectStorageMode() === 'desktop';
  }

  get user(): AuthUser | null {
    return this.isDesktopMode ? this.desktopSessionUser() : this.currentUser;
  }

  get isAuthenticated(): boolean {
    if (this.isDesktopMode) {
      return this.desktopSessionUser() !== null;
    }
    return this.currentUser !== null && this.getToken() !== null;
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  async login(email: string, password: string): Promise<AuthUser> {
    if (this.isDesktopMode) {
      return this.desktopLogin(email, password);
    }

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
    if (this.isDesktopMode) {
      const userDto = await this.localBackend!.register({ fullName, email, password });
      return this.toAuthUser(userDto.id, userDto.fullName, userDto.email, userDto.avatarUrl, userDto.role);
    }

    const body: AuthRegisterRequestDto = { fullName, email, password };

    const userDto = await firstValueFrom(
      this.httpClient.post<AuthUserResponseDto>(`${this.apiBaseUrl}/auth/register`, body),
    );

    return this.toAuthUser(userDto.id, userDto.fullName, userDto.email, userDto.avatarUrl, userDto.role);
  }

  async verifyEmail(token: string): Promise<void> {
    if (this.isDesktopMode) {
      await this.localBackend!.verifyEmail(token);
      return;
    }

    const body: VerifyEmailRequestDto = { token };
    await firstValueFrom(
      this.httpClient.post(`${this.apiBaseUrl}/auth/verify-email`, body),
    );
  }

  async resendVerification(email: string): Promise<void> {
    if (this.isDesktopMode) {
      await this.localBackend!.resendVerification(email);
      return;
    }

    const body: ResendVerificationRequestDto = { email };
    await firstValueFrom(
      this.httpClient.post(`${this.apiBaseUrl}/auth/resend-verification`, body),
    );
  }

  async forgotPassword(email: string): Promise<void> {
    if (this.isDesktopMode) {
      await this.localBackend!.forgotPassword(email);
      return;
    }

    const body: ForgotPasswordRequestDto = { email };
    await firstValueFrom(
      this.httpClient.post(`${this.apiBaseUrl}/auth/forgot-password`, body),
    );
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    if (this.isDesktopMode) {
      await this.localBackend!.resetPassword(token, newPassword);
      return;
    }

    const body: ResetPasswordRequestDto = { token, newPassword };
    await firstValueFrom(
      this.httpClient.post(`${this.apiBaseUrl}/auth/reset-password`, body),
    );
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    if (this.isDesktopMode) {
      const user = this.desktopSessionUser();
      if (!user) {
        return;
      }
      await this.localBackend!.changePassword(user.id, currentPassword, newPassword);
      return;
    }

    const body: ChangePasswordRequestDto = { currentPassword, newPassword };
    await firstValueFrom(
      this.httpClient.put(`${this.apiBaseUrl}/auth/password`, body),
    );
  }

  logout(): void {
    if (this.isDesktopMode) {
      this.sessionStore!.clear();
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUser = null;
  }

  private async desktopLogin(email: string, password: string): Promise<AuthUser> {
    const tokenResponse = await this.localBackend!.login(email, password);
    const user = this.localDatabase!.users.find((u) => u.email === email);

    if (!user) {
      throw new Error('Local account not found after login');
    }

    this.storeToken(tokenResponse.accessToken);
    this.storeUser(this.toAuthUser(user.id, user.fullName, user.email, user.avatarUrl, user.role));
    this.sessionStore!.setUserId(user.id);
    this.currentUser = this.loadStoredUser();

    this.themeService.loadFromBackend(user.id);

    return this.user!;
  }

  private desktopSessionUser(): AuthUser | null {
    const userId = this.sessionStore?.getUserId();
    if (userId == null) {
      return null;
    }
    const user = this.localDatabase?.users.find((u) => u.id === userId);
    if (!user) {
      return null;
    }
    return this.toAuthUser(user.id, user.fullName, user.email, user.avatarUrl, user.role);
  }

  private toAuthUser(
    id: number,
    fullName: string,
    email: string,
    avatarUrl: string | null,
    role: string,
  ): AuthUser {
    return { id, fullName, email, avatarUrl, role };
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
      role: userDto.role,
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
