package com.tiagorcunha.mykanban.backend.auth.application.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import com.tiagorcunha.mykanban.backend.auth.application.command.ChangePasswordCommand;
import com.tiagorcunha.mykanban.backend.auth.application.command.ForgotPasswordCommand;
import com.tiagorcunha.mykanban.backend.auth.application.command.ResetPasswordCommand;
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

@ExtendWith(MockitoExtension.class)
class AuthUseCaseHandlerTest {

  @Mock
  private UserRepositoryPort userRepository;
  @Mock
  private AuthenticatedUserProvider authenticatedUserProvider;
  @Mock
  private ApplicationEventPublisher eventPublisher;

  private PasswordHashService passwordHashService;
  private JwtTokenService jwtTokenService;
  private TokenProperties tokenProperties;
  private AuthUseCaseHandler handler;

  private User user;

  @BeforeEach
  void setUp() {
    passwordHashService = new PasswordHashService(new BCryptPasswordEncoder());
    JwtProperties jwtProperties = new JwtProperties();
    jwtProperties.setSecret("test-only-secret-that-is-longer-than-thirty-two-chars-1234567890");
    jwtProperties.setExpirationMinutes(120);
    jwtTokenService = new JwtTokenService(jwtProperties);
    tokenProperties = new TokenProperties();
    tokenProperties.setVerificationTtlMinutes(1440);
    tokenProperties.setResetTtlMinutes(15);

    handler = new AuthUseCaseHandler(
        userRepository,
        passwordHashService,
        jwtTokenService,
        jwtProperties,
        tokenProperties,
        authenticatedUserProvider,
        eventPublisher);

    user = new User();
    user.setId(7L);
    user.setFullName("Tiago Cunha");
    user.setEmail("tiago@example.com");
    user.setPasswordHash(passwordHashService.encodeIfNeeded("original-password"));
    user.setEmailVerified(true);
  }

  @Test
  void authenticate_returnsTokenForVerifiedUserWithValidCredentials() {
    when(userRepository.findByEmail("tiago@example.com")).thenReturn(Optional.of(user));

    var response = handler.authenticate("tiago@example.com", "original-password");

    assertThat(response.accessToken()).isNotBlank();
    assertThat(response.tokenType()).isEqualTo("Bearer");
    assertThat(jwtTokenService.extractUserId(response.accessToken())).isEqualTo(7L);
    assertThat(jwtTokenService.extractPurpose(response.accessToken())).isEqualTo(TokenPurpose.ACCESS);
  }

  @Test
  void authenticate_rejectsUnknownEmail() {
    when(userRepository.findByEmail("ghost@example.com")).thenReturn(Optional.empty());

    assertThatThrownBy(() -> handler.authenticate("ghost@example.com", "whatever"))
        .isInstanceOf(UnauthorizedException.class);
  }

  @Test
  void authenticate_rejectsWrongPassword() {
    when(userRepository.findByEmail("tiago@example.com")).thenReturn(Optional.of(user));

    assertThatThrownBy(() -> handler.authenticate("tiago@example.com", "wrong-password"))
        .isInstanceOf(UnauthorizedException.class);
  }

  @Test
  void authenticate_rejectsUnverifiedEmail() {
    user.setEmailVerified(false);
    when(userRepository.findByEmail("tiago@example.com")).thenReturn(Optional.of(user));

    assertThatThrownBy(() -> handler.authenticate("tiago@example.com", "original-password"))
        .isInstanceOf(ForbiddenException.class);
  }

  @Test
  void requestPasswordReset_publishesOneTimeResetTokenWhenEmailExists() {
    when(userRepository.findByEmail("tiago@example.com")).thenReturn(Optional.of(user));

    handler.requestPasswordReset(new ForgotPasswordCommand("tiago@example.com"));

    ArgumentCaptor<PasswordResetRequestedEvent> captor =
        ArgumentCaptor.forClass(PasswordResetRequestedEvent.class);
    verify(eventPublisher).publishEvent(captor.capture());

    PasswordResetRequestedEvent event = captor.getValue();
    assertThat(event.userId()).isEqualTo(7L);
    assertThat(event.email()).isEqualTo("tiago@example.com");
    assertThat(jwtTokenService.isTokenValidForPurpose(event.resetToken(), TokenPurpose.PASSWORD_RESET))
        .isTrue();
  }

  @Test
  void requestPasswordReset_publishesNothingForUnknownEmail() {
    when(userRepository.findByEmail("ghost@example.com")).thenReturn(Optional.empty());

    handler.requestPasswordReset(new ForgotPasswordCommand("ghost@example.com"));

    verify(eventPublisher, never()).publishEvent(org.mockito.ArgumentMatchers.any());
  }

  @Test
  void resetPassword_setsNewHashAndPublishesChangedEvent() {
    String resetToken = jwtTokenService.generateOneTimeToken(
        user, TokenPurpose.PASSWORD_RESET, tokenProperties.getResetTtlMinutes());
    when(userRepository.findById(7L)).thenReturn(Optional.of(user));
    when(userRepository.save(user)).thenReturn(user);

    handler.resetPassword(new ResetPasswordCommand(resetToken, "new-password"));

    assertThat(passwordHashService.matches("new-password", user.getPasswordHash())).isTrue();
    assertThat(passwordHashService.matches("original-password", user.getPasswordHash())).isFalse();

    ArgumentCaptor<PasswordChangedEvent> captor =
        ArgumentCaptor.forClass(PasswordChangedEvent.class);
    verify(eventPublisher).publishEvent(captor.capture());
    assertThat(captor.getValue().userId()).isEqualTo(7L);
  }

  @Test
  void resetPassword_rejectsTokenMintedForAnotherPurpose() {
    String verificationToken = jwtTokenService.generateOneTimeToken(
        user, TokenPurpose.EMAIL_VERIFICATION, tokenProperties.getVerificationTtlMinutes());

    assertThatThrownBy(() ->
        handler.resetPassword(new ResetPasswordCommand(verificationToken, "new-password")))
        .isInstanceOf(UnauthorizedException.class);
  }

  @Test
  void resetPassword_rejectsMalformedToken() {
    assertThatThrownBy(() ->
        handler.resetPassword(new ResetPasswordCommand("garbage-token", "new-password")))
        .isInstanceOf(UnauthorizedException.class);
  }

  @Test
  void resetPassword_rejectsResetForMissingUser() {
    String resetToken = jwtTokenService.generateOneTimeToken(
        user, TokenPurpose.PASSWORD_RESET, tokenProperties.getResetTtlMinutes());
    when(userRepository.findById(7L)).thenReturn(Optional.empty());

    assertThatThrownBy(() ->
        handler.resetPassword(new ResetPasswordCommand(resetToken, "new-password")))
        .isInstanceOf(ResourceNotFoundException.class);
  }

  @Test
  void changePassword_updatesHashAndPublishesChangedEvent() {
    when(authenticatedUserProvider.getAuthenticatedUser()).thenReturn(user);
    when(userRepository.save(user)).thenReturn(user);

    handler.changePassword(new ChangePasswordCommand("original-password", "brand-new-password"));

    assertThat(passwordHashService.matches("brand-new-password", user.getPasswordHash())).isTrue();

    ArgumentCaptor<PasswordChangedEvent> captor =
        ArgumentCaptor.forClass(PasswordChangedEvent.class);
    verify(eventPublisher).publishEvent(captor.capture());
    assertThat(captor.getValue().userId()).isEqualTo(7L);
  }

  @Test
  void changePassword_rejectsWrongCurrentPassword() {
    when(authenticatedUserProvider.getAuthenticatedUser()).thenReturn(user);

    assertThatThrownBy(() ->
        handler.changePassword(new ChangePasswordCommand("nope", "brand-new-password")))
        .isInstanceOf(ForbiddenException.class);

    verify(eventPublisher, never()).publishEvent(org.mockito.ArgumentMatchers.any());
    assertThat(passwordHashService.matches("original-password", user.getPasswordHash())).isTrue();
  }
}
