package com.tiagorcunha.mykanban.backend.auth.infrastructure.web;

import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.tiagorcunha.mykanban.backend.auth.application.command.ChangePasswordCommand;
import com.tiagorcunha.mykanban.backend.auth.application.command.ForgotPasswordCommand;
import com.tiagorcunha.mykanban.backend.auth.application.command.ResetPasswordCommand;
import com.tiagorcunha.mykanban.backend.auth.application.port.in.ChangePasswordUseCase;
import com.tiagorcunha.mykanban.backend.auth.application.port.in.ForgotPasswordUseCase;
import com.tiagorcunha.mykanban.backend.auth.application.port.in.ResetPasswordUseCase;
import com.tiagorcunha.mykanban.backend.auth.application.response.AuthTokenResponse;
import com.tiagorcunha.mykanban.backend.auth.application.usecase.AuthUseCaseHandler;
import com.tiagorcunha.mykanban.backend.user.application.command.ResendVerificationCommand;
import com.tiagorcunha.mykanban.backend.user.application.command.VerifyEmailCommand;
import com.tiagorcunha.mykanban.backend.user.application.port.in.CreateUserUseCase;
import com.tiagorcunha.mykanban.backend.user.application.port.in.ResendVerificationUseCase;
import com.tiagorcunha.mykanban.backend.user.application.port.in.VerifyEmailUseCase;
import com.tiagorcunha.mykanban.backend.user.application.response.UserResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/auth")
@Validated
@Tag(name = "Auth", description = "Authentication endpoints")
public class AuthController {

  private final AuthUseCaseHandler authUseCaseHandler;
  private final CreateUserUseCase createUserUseCase;
  private final VerifyEmailUseCase verifyEmailUseCase;
  private final ResendVerificationUseCase resendVerificationUseCase;
  private final ForgotPasswordUseCase forgotPasswordUseCase;
  private final ResetPasswordUseCase resetPasswordUseCase;
  private final ChangePasswordUseCase changePasswordUseCase;

  public AuthController(
      AuthUseCaseHandler authUseCaseHandler,
      CreateUserUseCase createUserUseCase,
      VerifyEmailUseCase verifyEmailUseCase,
      ResendVerificationUseCase resendVerificationUseCase,
      ForgotPasswordUseCase forgotPasswordUseCase,
      ResetPasswordUseCase resetPasswordUseCase,
      ChangePasswordUseCase changePasswordUseCase) {
    this.authUseCaseHandler = authUseCaseHandler;
    this.createUserUseCase = createUserUseCase;
    this.verifyEmailUseCase = verifyEmailUseCase;
    this.resendVerificationUseCase = resendVerificationUseCase;
    this.forgotPasswordUseCase = forgotPasswordUseCase;
    this.resetPasswordUseCase = resetPasswordUseCase;
    this.changePasswordUseCase = changePasswordUseCase;
  }

  @PostMapping("/login")
  @Operation(summary = "Authenticate and receive a JWT access token")
  @ApiResponse(responseCode = "200", description = "Authenticated")
  @ApiResponse(responseCode = "401", description = "Invalid credentials")
  @ApiResponse(responseCode = "403", description = "Email not verified yet")
  public AuthTokenResponse login(@Valid @RequestBody AuthLoginRequest request) {
    return authUseCaseHandler.authenticate(request.email(), request.password());
  }

  @PostMapping("/register")
  @Operation(summary = "Register a new user (account starts unverified)")
  @ApiResponse(responseCode = "200", description = "Registered")
  @ApiResponse(responseCode = "409", description = "Email already in use")
  public UserResponse register(@Valid @RequestBody AuthRegisterRequest request) {
    return createUserUseCase.create(request.toCommand());
  }

  @PostMapping("/verify-email")
  @Operation(summary = "Activate an account using the token from the verification email")
  @ApiResponse(responseCode = "204", description = "Email verified")
  @ApiResponse(responseCode = "401", description = "Invalid or expired verification link")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
    verifyEmailUseCase.verify(new VerifyEmailCommand(request.token()));
  }

  @PostMapping("/resend-verification")
  @Operation(summary = "Send a new activation email to an unverified account")
  @ApiResponse(responseCode = "204", description = "Accepted (email sent only if the account exists and is unverified)")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void resendVerification(@Valid @RequestBody ResendVerificationRequest request) {
    resendVerificationUseCase.resendVerification(new ResendVerificationCommand(request.email()));
  }

  @PostMapping("/forgot-password")
  @Operation(summary = "Send a password reset email for an existing account")
  @ApiResponse(responseCode = "204", description = "Accepted (email sent only if the account exists)")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
    forgotPasswordUseCase.requestPasswordReset(new ForgotPasswordCommand(request.email()));
  }

  @PostMapping("/reset-password")
  @Operation(summary = "Set a new password using the token from the reset email")
  @ApiResponse(responseCode = "204", description = "Password updated")
  @ApiResponse(responseCode = "401", description = "Invalid or expired reset link")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
    resetPasswordUseCase.resetPassword(new ResetPasswordCommand(request.token(), request.newPassword()));
  }

  @PutMapping("/password")
  @Operation(summary = "Change the authenticated user's password")
  @ApiResponse(responseCode = "204", description = "Password updated")
  @ApiResponse(responseCode = "403", description = "Current password is incorrect")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void changePassword(@Valid @RequestBody ChangePasswordRequest request) {
    changePasswordUseCase.changePassword(
        new ChangePasswordCommand(request.currentPassword(), request.newPassword()));
  }
}
