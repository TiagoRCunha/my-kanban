import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';

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

    const user = { id: 1, fullName: 'Test', email: 'test@test.com', avatarUrl: null };
    localStorage.setItem('mykanban_access_token', 'some-token');
    localStorage.setItem('mykanban_user', JSON.stringify(user));

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
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
      localStorage.setItem('mykanban_user', JSON.stringify({ id: 1, email: 'test@test.com', fullName: 'Test' }));

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
        createdAt: '2026-07-05T10:00:00',
        updatedAt: '2026-07-05T10:00:00',
      });

      const user = await registerPromise;

      expect(user.id).toBe(2);
      expect(user.email).toBe('new@example.com');
      expect(service.isAuthenticated).toBeFalse();
    });
  });
});
