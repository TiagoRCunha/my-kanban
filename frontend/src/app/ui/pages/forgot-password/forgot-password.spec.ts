import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ForgotPasswordPage } from './forgot-password';

describe('ForgotPasswordPage', () => {
  let fixture: ComponentFixture<ForgotPasswordPage>;
  let component: ForgotPasswordPage;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForgotPasswordPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordPage);
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

  it('should request a reset link and show a success message', async () => {
    component.email = 'test@example.com';
    const submitPromise = component.onSubmit();

    const req = httpMock.expectOne('http://localhost:8080/auth/forgot-password');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'test@example.com' });
    req.flush(null);

    await submitPromise;
    fixture.detectChanges();

    expect(component.successMessage).toContain('reset link');
    const success = fixture.nativeElement.querySelector('.auth-card__success') as HTMLElement;
    expect(success).toBeTruthy();
  });

  it('should surface an error when the request fails', async () => {
    component.email = 'test@example.com';
    const submitPromise = component.onSubmit();

    const req = httpMock.expectOne('http://localhost:8080/auth/forgot-password');
    req.flush('nope', { status: 500, statusText: 'Server Error' });

    await submitPromise;
    fixture.detectChanges();

    expect(component.errorMessage).toContain('Something went wrong');
    expect(component.successMessage).toBe('');
  });
});
