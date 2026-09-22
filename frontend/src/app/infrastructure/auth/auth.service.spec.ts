import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { provideRepositoryVeneer } from '../di/repository-veneer.providers';
import { USER_CONFIG_REPOSITORY } from '../di/repository-tokens';
import { HttpUserConfigAdapter } from '../user-config/adapters/http-user-config.adapter';
import { LOCAL_DATABASE, LOCAL_SESSION_STORE } from '../local/di/local-veneer.providers';
import type { LocalDatabaseSnapshot } from '../local/local-database';

type BridgeApi = {
  loadSnapshot(): Promise<LocalDatabaseSnapshot | null>;
  saveSnapshot(snapshot: LocalDatabaseSnapshot): Promise<void>;
};

const NOW = '2026-09-20T10:00:00.000Z';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: USER_CONFIG_REPOSITORY, useExisting: HttpUserConfigAdapter },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should not be authenticated when no token is stored', () => {
    expect(service.isAuthenticated).toBeFalse();
    expect(service.user).toBeNull();
  });

  it('should return null token when nothing is stored', () => {
    expect(service.getToken()).toBeNull();
  });

  it('should return stored token', () => {
    localStorage.setItem('mykanban_access_token', 'my-test-token');
    expect(service.getToken()).toBe('my-test-token');
  });

  it('should restore user from localStorage on construction', () => {
    // Must set localStorage BEFORE injecting the service (new module)
    TestBed.resetTestingModule();

    const user = { id: 1, fullName: 'Test', email: 'test@test.com', avatarUrl: null, role: 'USER' };
    localStorage.setItem('mykanban_access_token', 'some-token');
    localStorage.setItem('mykanban_user', JSON.stringify(user));

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: USER_CONFIG_REPOSITORY, useExisting: HttpUserConfigAdapter },
      ],
    });

    const freshService = TestBed.inject(AuthService);

    expect(freshService.isAuthenticated).toBeTrue();
    expect(freshService.user?.email).toBe('test@test.com');
  });

  it('should handle corrupted localStorage gracefully', () => {
    TestBed.resetTestingModule();

    localStorage.setItem('mykanban_access_token', 'some-token');
    localStorage.setItem('mykanban_user', 'not-valid-json');

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: USER_CONFIG_REPOSITORY, useExisting: HttpUserConfigAdapter },
      ],
    });

    const freshService = TestBed.inject(AuthService);

    expect(freshService.isAuthenticated).toBeFalse();
    expect(freshService.user).toBeNull();
    expect(localStorage.getItem('mykanban_access_token')).toBeNull();
  });

  describe('login', () => {
    it('should authenticate user and store token', async () => {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({ sub: 'tiago@example.com', uid: 1, exp: 9999999999 }));
      const token = `${header}.${payload}.fake-signature`;

      const loginPromise = service.login('tiago@example.com', 'password');

      // Flush login POST - this resolves firstValueFrom, which triggers fetchCurrentUser
      const loginReq = httpMock.expectOne((req) => req.url.endsWith('/auth/login'));
      expect(loginReq.request.method).toBe('POST');
      loginReq.flush({ accessToken: token, tokenType: 'Bearer', expiresInMinutes: 120 });

      // Let microtask queue drain so fetchCurrentUser's HTTP request is created
      await new Promise<void>((resolve) => setTimeout(resolve, 0));

      // Now flush user GET
      const userReq = httpMock.expectOne((req) => req.url.includes('/users/'));
      expect(userReq.request.method).toBe('GET');
      userReq.flush({
        id: 1,
        fullName: 'Tiago Cunha',
        email: 'tiago@example.com',
        avatarUrl: null,
        role: 'USER',
        createdAt: '2026-07-05T10:00:00',
        updatedAt: '2026-07-05T10:00:00',
      });

      // ThemeService.loadFromBackend() triggers a GET /users/{id}/config
      await new Promise<void>((resolve) => setTimeout(resolve, 0));

      const configReq = httpMock.expectOne((req) => req.url.endsWith('/config'));
      expect(configReq.request.method).toBe('GET');
      configReq.flush({
        id: 1,
        userId: 1,
        darkMode: false,
        startupColumns: [],
        customTags: [],
        createdAt: '2026-07-05T10:00:00',
        updatedAt: '2026-07-05T10:00:00',
      });

      const user = await loginPromise;

      expect(user.id).toBe(1);
      expect(user.email).toBe('tiago@example.com');
      expect(service.isAuthenticated).toBeTrue();
      expect(localStorage.getItem('mykanban_access_token')).toBe(token);
    });
  });

  describe('logout', () => {
    it('should clear stored token and user', () => {
      localStorage.setItem('mykanban_access_token', 'test-token');
      localStorage.setItem('mykanban_user', JSON.stringify({ id: 1, email: 'test@test.com', fullName: 'Test', role: 'USER' }));

      service.logout();

      expect(service.isAuthenticated).toBeFalse();
      expect(service.user).toBeNull();
      expect(localStorage.getItem('mykanban_access_token')).toBeNull();
      expect(localStorage.getItem('mykanban_user')).toBeNull();
    });
  });

  describe('register', () => {
    it('should register a new user without auto-logging in', async () => {
      const registerPromise = service.register('New User', 'new@example.com', 'password123');

      const req = httpMock.expectOne('http://localhost:8080/auth/register');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        fullName: 'New User',
        email: 'new@example.com',
        password: 'password123',
      });

      req.flush({
        id: 2,
        fullName: 'New User',
        email: 'new@example.com',
        avatarUrl: null,
        role: 'USER',
        createdAt: '2026-07-05T10:00:00',
        updatedAt: '2026-07-05T10:00:00',
      });

      const user = await registerPromise;

      expect(user.id).toBe(2);
      expect(user.email).toBe('new@example.com');
      expect(service.isAuthenticated).toBeFalse();
    });
  });

  describe('verifyEmail', () => {
    it('should POST the verification token', async () => {
      const verifyPromise = service.verifyEmail('some-token');

      const req = httpMock.expectOne('http://localhost:8080/auth/verify-email');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ token: 'some-token' });

      req.flush(null);
      await verifyPromise;
    });
  });

  describe('resendVerification', () => {
    it('should POST the email to resend a verification link', async () => {
      const resendPromise = service.resendVerification('test@example.com');

      const req = httpMock.expectOne('http://localhost:8080/auth/resend-verification');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'test@example.com' });

      req.flush(null);
      await resendPromise;
    });
  });

  describe('forgotPassword', () => {
    it('should POST the email to request a reset link', async () => {
      const forgotPromise = service.forgotPassword('test@example.com');

      const req = httpMock.expectOne('http://localhost:8080/auth/forgot-password');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'test@example.com' });

      req.flush(null);
      await forgotPromise;
    });
  });

  describe('resetPassword', () => {
    it('should POST the token and new password', async () => {
      const resetPromise = service.resetPassword('reset-token', 'brand-new-password');

      const req = httpMock.expectOne('http://localhost:8080/auth/reset-password');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        token: 'reset-token',
        newPassword: 'brand-new-password',
      });

      req.flush(null);
      await resetPromise;
    });
  });

  describe('changePassword', () => {
    it('should PUT the current and new password', async () => {
      const changePromise = service.changePassword('current-password', 'brand-new-password');

      const req = httpMock.expectOne('http://localhost:8080/auth/password');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({
        currentPassword: 'current-password',
        newPassword: 'brand-new-password',
      });

      req.flush(null);
      await changePromise;
    });
  });

  describe('desktop mode', () => {
    const userConfigDescriptor = {
      getConfig: () => Promise.resolve({
        id: 1,
        userId: 1,
        darkMode: false,
        defaultTaskLimit: 10,
        startupColumns: [],
        customTags: [],
        createdAt: NOW,
        updatedAt: NOW,
      }),
      updateDarkMode: () => Promise.resolve(),
    };

    function configureDesktopInjector(): void {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          AuthService,
          provideHttpClient(),
          provideHttpClientTesting(),
          provideRepositoryVeneer('desktop'),
          { provide: USER_CONFIG_REPOSITORY, useValue: userConfigDescriptor },
        ],
      });
    }

    beforeEach(() => {
      (window as Window & { api?: BridgeApi }).api = {
        loadSnapshot: async () => null,
        saveSnapshot: async () => {},
      };
    });

    afterEach(() => {
      delete (window as Window & { api?: BridgeApi }).api;
      localStorage.clear();
    });

    it('should be authenticated from a seeded local session', async () => {
      configureDesktopInjector();
      const database = TestBed.inject(LOCAL_DATABASE);
      const session = TestBed.inject(LOCAL_SESSION_STORE);
      database.nextId('users');
      database.users.push({
        id: 1,
        fullName: 'Local User',
        email: 'local@mykanban.app',
        passwordHash: 'mykanban',
        avatarUrl: null,
        role: 'ADMIN',
        emailVerified: true,
        createdAt: NOW,
        updatedAt: NOW,
      });
      session.setUserId(1);

      service = TestBed.inject(AuthService);

      expect(service.isAuthenticated).toBeTrue();
      expect(service.user?.email).toBe('local@mykanban.app');
    });

    it('should not be authenticated without a local session', async () => {
      configureDesktopInjector();
      TestBed.inject(LOCAL_DATABASE);

      service = TestBed.inject(AuthService);

      expect(service.isAuthenticated).toBeFalse();
      expect(service.user).toBeNull();
    });

    it('should log in through the local backend', async () => {
      configureDesktopInjector();
      const database = TestBed.inject(LOCAL_DATABASE);
      database.nextId('users');
      database.users.push({
        id: 1,
        fullName: 'Local User',
        email: 'local@mykanban.app',
        passwordHash: 'mykanban',
        avatarUrl: null,
        role: 'ADMIN',
        emailVerified: true,
        createdAt: NOW,
        updatedAt: NOW,
      });

      service = TestBed.inject(AuthService);
      const loginPromise = service.login('local@mykanban.app', 'mykanban');

      // Let ThemeService.loadFromBackend's microtasks drain.
      await new Promise<void>((resolve) => setTimeout(resolve, 0));

      const user = await loginPromise;

      expect(user.id).toBe(1);
      expect(service.isAuthenticated).toBeTrue();
      expect(TestBed.inject(LOCAL_SESSION_STORE).getUserId()).toBe(1);
    });

    it('should clear the local session on logout', async () => {
      configureDesktopInjector();
      const database = TestBed.inject(LOCAL_DATABASE);
      const session = TestBed.inject(LOCAL_SESSION_STORE);
      database.nextId('users');
      database.users.push({
        id: 1,
        fullName: 'Local User',
        email: 'local@mykanban.app',
        passwordHash: 'mykanban',
        avatarUrl: null,
        role: 'ADMIN',
        emailVerified: true,
        createdAt: NOW,
        updatedAt: NOW,
      });
      session.setUserId(1);

      service = TestBed.inject(AuthService);
      expect(service.isAuthenticated).toBeTrue();

      service.logout();

      expect(service.isAuthenticated).toBeFalse();
      expect(session.getUserId()).toBeNull();
    });
  });
});
