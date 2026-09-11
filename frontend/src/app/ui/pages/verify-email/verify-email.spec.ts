import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { VerifyEmailPage } from './verify-email';

describe('VerifyEmailPage', () => {
  let fixture: ComponentFixture<VerifyEmailPage>;
  let component: VerifyEmailPage;
  let httpMock: HttpTestingController;
  let params: Map<string, string>;

  beforeEach(async () => {
    params = new Map<string, string>();

    await TestBed.configureTestingModule({
      imports: [VerifyEmailPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
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

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create the page', () => {
    fixture = TestBed.createComponent(VerifyEmailPage);
    component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should verify the email when a token is present', async () => {
    params.set('token', 'verify-token');
    fixture = TestBed.createComponent(VerifyEmailPage);
    component = fixture.componentInstance;
    fixture.detectChanges(); // triggers ngOnInit

    expect(component.status).toBe('verifying');

    const req = httpMock.expectOne('http://localhost:8080/auth/verify-email');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ token: 'verify-token' });
    req.flush(null);

    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.status).toBe('verified');
    expect(fixture.nativeElement.textContent).toContain('Email verified');
  });

  it('should surface a failure when the verification token is invalid', async () => {
    params.set('token', 'expired-token');
    fixture = TestBed.createComponent(VerifyEmailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const req = httpMock.expectOne('http://localhost:8080/auth/verify-email');
    req.flush('expired', { status: 401, statusText: 'Unauthorized' });

    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.status).toBe('failed');
    expect(component.errorMessage).toContain('invalid or has expired');
  });

  it('should resend the verification email for an unverified account', async () => {
    params.set('email', 'test@example.com');
    fixture = TestBed.createComponent(VerifyEmailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.status).toBe('idle');

    const resendPromise = component.resend();

    const req = httpMock.expectOne('http://localhost:8080/auth/resend-verification');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'test@example.com' });
    req.flush(null);

    await resendPromise;
    fixture.detectChanges();

    expect(component.resendMessage).toContain('A new verification email');
  });

  it('should show a welcome message after registration', () => {
    params.set('email', 'test@example.com');
    params.set('registered', 'true');
    fixture = TestBed.createComponent(VerifyEmailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Your account was created');
  });
});
