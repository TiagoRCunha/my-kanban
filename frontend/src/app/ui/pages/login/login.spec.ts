import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from '../../../infrastructure/auth';
import { LoginPage } from './login';

describe('LoginPage', () => {
  let fixture: ComponentFixture<LoginPage>;
  let component: LoginPage;
  let authSpy: jasmine.SpyObj<AuthService>;
  let navigateSpy: jasmine.Spy;

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj('AuthService', ['login']);

    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authSpy },
      ],
    }).compileComponents();

    navigateSpy = spyOn(TestBed.inject(Router), 'navigate');

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the page', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate to boards on successful login', async () => {
    authSpy.login.and.resolveTo({ id: 1, fullName: 'X', email: 'x@example.com', avatarUrl: null, role: 'USER' });
    component.email = 'x@example.com';
    component.password = 'secret';

    await component.onSubmit();

    expect(navigateSpy).toHaveBeenCalledWith(['/boards']);
    expect(component.needsVerification).toBeFalse();
  });

  it('should show a resend-verification prompt when login is forbidden', async () => {
    authSpy.login.and.rejectWith({ status: 403 });
    component.email = 'unverified@example.com';
    component.password = 'secret';

    await component.onSubmit();
    fixture.detectChanges();

    expect(component.needsVerification).toBeTrue();
    expect(component.errorMessage).toContain('verify your email');
    expect(fixture.nativeElement.textContent).toContain('Resend verification');
    expect(component.verifyEmailLink).toContain('unverified%40example.com');
  });

  it('should show a generic error on invalid credentials', async () => {
    authSpy.login.and.rejectWith({ status: 401 });
    component.email = 'x@example.com';
    component.password = 'wrong';

    await component.onSubmit();
    fixture.detectChanges();

    expect(component.needsVerification).toBeFalse();
    expect(component.errorMessage).toContain('Invalid email or password');
  });
});
