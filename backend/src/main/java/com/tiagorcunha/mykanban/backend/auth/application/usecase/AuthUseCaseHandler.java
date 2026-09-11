package com.tiagorcunha.mykanban.backend.auth.application.usecase;

import java.time.LocalDateTime;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tiagorcunha.mykanban.backend.auth.application.command.ChangePasswordCommand;
import com.tiagorcunha.mykanban.backend.auth.application.command.ForgotPasswordCommand;
import com.tiagorcunha.mykanban.backend.auth.application.command.ResetPasswordCommand;
import com.tiagorcunha.mykanban.backend.auth.application.port.in.ChangePasswordUseCase;
import com.tiagorcunha.mykanban.backend.auth.application.port.in.ForgotPasswordUseCase;
import com.tiagorcunha.mykanban.backend.auth.application.port.in.ResetPasswordUseCase;
import com.tiagorcunha.mykanban.backend.auth.application.response.AuthTokenResponse;
import com.tiagorcunha.mykanban.backend.common.application.exception.ForbiddenException;
import com.tiagorcunha.mykanban.backend.common.application.exception.ResourceNotFoundException;
import com.tiagorcunha.mykanban.backend.common.application.exception.UnauthorizedException;
import com.tiagorcunha.mykanban.backend.common.infrastructure.security.AuthenticatedUserProvider;
import com.tiagorcunha.mykanban.backend.common.infrastructure.security.JwtProperties;
import com.tiagorcunha.mykanban.backend.common.infrastructure.security.JwtTokenService;
import com.tiagorcunha.mykanban.backend.common.infrastructure.security.PasswordHashService;
import com.tiagorcunha.mykanban.backend.common.infrastructure.security.TokenProperties;
import com.tiagorcunha.mykanban.backend.common.infrastructure.security.TokenPurpose;
import com.tiagorcunha.mykanban.backend.user.application.port.out.UserRepositoryPort;
import com.tiagorcunha.mykanban.backend.user.domain.event.PasswordChangedEvent;
import com.tiagorcunha.mykanban.backend.user.domain.event.PasswordResetRequestedEvent;
import com.tiagorcunha.mykanban.backend.user.domain.model.User;

import io.jsonwebtoken.JwtException;

@Service
public class AuthUseCaseHandler
    implements ForgotPasswordUseCase, ResetPasswordUseCase, ChangePasswordUseCase {

  private final UserRepositoryPort userRepository;
  private final PasswordHashService passwordHashService;
  private final JwtTokenService jwtTokenService;
  private final JwtProperties jwtProperties;
  private final TokenProperties tokenProperties;
  private final AuthenticatedUserProvider authenticatedUserProvider;
  private final ApplicationEventPublisher eventPublisher;

  public AuthUseCaseHandler(
      UserRepositoryPort userRepository,
      PasswordHashService passwordHashService,
      JwtTokenService jwtTokenService,
      JwtProperties jwtProperties,
      TokenProperties tokenProperties,
      AuthenticatedUserProvider authenticatedUserProvider,
      ApplicationEventPublisher eventPublisher) {
    this.userRepository = userRepository;
    this.passwordHashService = passwordHashService;
    this.jwtTokenService = jwtTokenService;
    this.jwtProperties = jwtProperties;
    this.tokenProperties = tokenProperties;
    this.authenticatedUserProvider = authenticatedUserProvider;
    this.eventPublisher = eventPublisher;
  }

  public AuthTokenResponse authenticate(String email, String rawPassword) {
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new UnauthorizedException("Invalid credentials"));

    if (!passwordHashService.matches(rawPassword, user.getPasswordHash())) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (!user.isEmailVerified()) {
      throw new ForbiddenException("Please verify your email before signing in");
    }

    String token = jwtTokenService.generateToken(user);
    return new AuthTokenResponse(token, "Bearer", jwtProperties.getExpirationMinutes());
  }

  @Override
  @Transactional
  public void requestPasswordReset(ForgotPasswordCommand command) {
    // Always succeeds from the caller's perspective to avoid leaking which
    // emails are registered. Unverified accounts can still reset their
    // password; the reset link does not require a verified email.
    userRepository.findByEmail(command.email())
        .ifPresent(this::publishPasswordResetEmail);
  }

  @Override
  @Transactional
  public void resetPassword(ResetPasswordCommand command) {
    Long userId = extractResetUserId(command.token());
    User user = getExistingUser(userId);

    user.setPasswordHash(passwordHashService.encodeIfNeeded(command.newPassword()));
    user.setUpdatedAt(LocalDateTime.now());
    userRepository.save(user);

    eventPublisher.publishEvent(new PasswordChangedEvent(
        user.getId(),
        user.getEmail(),
        user.getFullName()));
  }

  @Override
  @Transactional
  public void changePassword(ChangePasswordCommand command) {
    User user = authenticatedUserProvider.getAuthenticatedUser();

    if (!passwordHashService.matches(command.currentPassword(), user.getPasswordHash())) {
      throw new ForbiddenException("Current password is incorrect");
    }

    user.setPasswordHash(passwordHashService.encodeIfNeeded(command.newPassword()));
    user.setUpdatedAt(LocalDateTime.now());
    userRepository.save(user);

    eventPublisher.publishEvent(new PasswordChangedEvent(
        user.getId(),
        user.getEmail(),
        user.getFullName()));
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private void publishPasswordResetEmail(User user) {
    String resetToken = jwtTokenService.generateOneTimeToken(
        user,
        TokenPurpose.PASSWORD_RESET,
        tokenProperties.getResetTtlMinutes());

    eventPublisher.publishEvent(new PasswordResetRequestedEvent(
        user.getId(),
        user.getEmail(),
        user.getFullName(),
        resetToken));
  }

  private Long extractResetUserId(String token) {
    try {
      if (!jwtTokenService.isTokenValidForPurpose(token, TokenPurpose.PASSWORD_RESET)) {
        throw new UnauthorizedException("Invalid or expired reset link");
      }
      return jwtTokenService.extractUserId(token);
    } catch (JwtException | IllegalArgumentException exception) {
      throw new UnauthorizedException("Invalid or expired reset link");
    }
  }

  private User getExistingUser(Long id) {
    return userRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("User not found"));
  }
}
