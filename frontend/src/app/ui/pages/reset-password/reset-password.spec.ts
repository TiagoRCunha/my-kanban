import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { ResetPasswordPage } from './reset-password';

describe('ResetPasswordPage', () => {
  let fixture: ComponentFixture<ResetPasswordPage>;
  let component: ResetPasswordPage;
  let httpMock: HttpTestingController;
  let navigateSpy: jasmine.Spy;
  let params: Map<string, string>;

  beforeEach(async () => {
    params = new Map<string, string>();

    await TestBed.configureTestingModule({
      imports: [ResetPasswordPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            get snapshot() {
              return { queryParamMap: params };
            },
          },
        },
      ],
    }).compileComponents();

    navigateSpy = spyOn(TestBed.inject(Router), 'navigate');

    fixture = TestBed.createComponent(ResetPasswordPage);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create the page', () => {
    expect(component).toBeTruthy();
  });

  it('should read the token from the query string', () => {
    params.set('token', 'reset-token');
    fixture = TestBed.createComponent(ResetPasswordPage);
    component = fixture.componentInstance;

    expect(component.hasToken).toBeTrue();
    expect(component.token).toBe('reset-token');
  });

  it('should warn when no token is present', () => {
    expect(component.hasToken).toBeFalse();
    expect(fixture.nativeElement.textContent).toContain('Request a new link');
  });

  it('should reset the password and navigate to login', async () => {
    params.set('token', 'reset-token');
    fixture = TestBed.createComponent(ResetPasswordPage);
    component = fixture.componentInstance;

    component.newPassword = 'brand-new-password';
    component.confirmPassword = 'brand-new-password';
    const submitPromise = component.onSubmit();

    const req = httpMock.expectOne('http://localhost:8080/auth/reset-password');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      token: 'reset-token',
      newPassword: 'brand-new-password',
    });
    req.flush(null);

    await submitPromise;

    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('should reject mismatched passwords without calling the API', async () => {
    params.set('token', 'reset-token');
    fixture = TestBed.createComponent(ResetPasswordPage);
    component = fixture.componentInstance;

    component.newPassword = 'brand-new-password';
    component.confirmPassword = 'different-password';
    await component.onSubmit();

    expect(component.errorMessage).toContain('do not match');
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('should show an error when the reset token is invalid', async () => {
    params.set('token', 'expired-token');
    fixture = TestBed.createComponent(ResetPasswordPage);
    component = fixture.componentInstance;

    component.newPassword = 'brand-new-password';
    component.confirmPassword = 'brand-new-password';
    const submitPromise = component.onSubmit();

    const req = httpMock.expectOne('http://localhost:8080/auth/reset-password');
    req.flush('expired', { status: 401, statusText: 'Unauthorized' });

    await submitPromise;

    expect(component.errorMessage).toContain('invalid or has expired');
    expect(navigateSpy).not.toHaveBeenCalled();
  });
});
