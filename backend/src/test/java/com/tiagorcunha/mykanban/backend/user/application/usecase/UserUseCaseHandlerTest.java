package com.tiagorcunha.mykanban.backend.user.application.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import com.tiagorcunha.mykanban.backend.common.application.exception.UnauthorizedException;
import com.tiagorcunha.mykanban.backend.common.infrastructure.security.AuthenticatedUserProvider;
import com.tiagorcunha.mykanban.backend.common.infrastructure.security.JwtProperties;
import com.tiagorcunha.mykanban.backend.common.infrastructure.security.JwtTokenService;
import com.tiagorcunha.mykanban.backend.common.infrastructure.security.PasswordHashService;
import com.tiagorcunha.mykanban.backend.common.infrastructure.security.TokenProperties;
import com.tiagorcunha.mykanban.backend.common.infrastructure.security.TokenPurpose;
import com.tiagorcunha.mykanban.backend.user.application.command.ResendVerificationCommand;
import com.tiagorcunha.mykanban.backend.user.application.command.SaveUserCommand;
import com.tiagorcunha.mykanban.backend.user.application.command.VerifyEmailCommand;
import com.tiagorcunha.mykanban.backend.user.application.port.out.UserConfigRepositoryPort;
import com.tiagorcunha.mykanban.backend.user.application.port.out.UserCustomTagRepositoryPort;
import com.tiagorcunha.mykanban.backend.user.application.port.out.UserRepositoryPort;
import com.tiagorcunha.mykanban.backend.user.application.port.out.UserStartupColumnRepositoryPort;
import com.tiagorcunha.mykanban.backend.user.domain.event.UserRegisteredEvent;
import com.tiagorcunha.mykanban.backend.user.domain.model.User;

@ExtendWith(MockitoExtension.class)
class UserUseCaseHandlerTest {

  @Mock
  private UserRepositoryPort userRepository;
  @Mock
  private AuthenticatedUserProvider authenticatedUserProvider;
  @Mock
  private UserConfigRepositoryPort userConfigRepository;
  @Mock
  private UserStartupColumnRepositoryPort startupColumnRepository;
  @Mock
  private UserCustomTagRepositoryPort customTagRepository;
  @Mock
  private ApplicationEventPublisher eventPublisher;

  private PasswordHashService passwordHashService;
  private JwtTokenService jwtTokenService;
  private TokenProperties tokenProperties;
  private UserUseCaseHandler handler;

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

    handler = new UserUseCaseHandler(
        userRepository,
        passwordHashService,
        authenticatedUserProvider,
        userConfigRepository,
        startupColumnRepository,
        customTagRepository,
        eventPublisher,
        jwtTokenService,
        tokenProperties);
  }

  @Test
  void create_marksSelfRegisteredUserUnverifiedAndPublishesVerificationEvent() {
    when(userRepository.existsByEmail("tiago@example.com")).thenReturn(false);
    when(userRepository.save(any(User.class)))
        .thenAnswer(invocation -> {
          User saved = invocation.getArgument(0);
          saved.setId(99L);
          return saved;
        });

    handler.create(new SaveUserCommand(
        "Tiago Cunha", "tiago@example.com", "raw-password", null, false));

    ArgumentCaptor<User> savedCaptor = ArgumentCaptor.forClass(User.class);
    verify(userRepository).save(savedCaptor.capture());
    assertThat(savedCaptor.getValue().isEmailVerified()).isFalse();

    ArgumentCaptor<UserRegisteredEvent> eventCaptor =
        ArgumentCaptor.forClass(UserRegisteredEvent.class);
    verify(eventPublisher).publishEvent(eventCaptor.capture());
    UserRegisteredEvent event = eventCaptor.getValue();
    assertThat(event.userId()).isEqualTo(99L);
    assertThat(event.email()).isEqualTo("tiago@example.com");
    assertThat(jwtTokenService.isTokenValidForPurpose(
        event.verificationToken(), TokenPurpose.EMAIL_VERIFICATION)).isTrue();
  }

  @Test
  void create_withNullEmailVerifiedTreatsAccountAsVerifiedAndPublishesNothing() {
    when(userRepository.existsByEmail("admin-made@example.com")).thenReturn(false);
    when(userRepository.save(any(User.class)))
        .thenAnswer(invocation -> {
          User saved = invocation.getArgument(0);
          saved.setId(100L);
          return saved;
        });

    handler.create(new SaveUserCommand(
        "Admin Made", "admin-made@example.com", "raw-password", null, null));

    ArgumentCaptor<User> savedCaptor = ArgumentCaptor.forClass(User.class);
    verify(userRepository).save(savedCaptor.capture());
    assertThat(savedCaptor.getValue().isEmailVerified()).isTrue();

    verify(eventPublisher, never()).publishEvent(any(UserRegisteredEvent.class));
  }

  @Test
  void verify_marksUnverifiedUserAsVerified() {
    User unverified = unverifiedUser(7L, "tiago@example.com");
    String token = jwtTokenService.generateOneTimeToken(
        unverified, TokenPurpose.EMAIL_VERIFICATION, tokenProperties.getVerificationTtlMinutes());
    when(userRepository.findById(7L)).thenReturn(Optional.of(unverified));

    handler.verify(new VerifyEmailCommand(token));

    assertThat(unverified.isEmailVerified()).isTrue();
    verify(userRepository).save(unverified);
  }

  @Test
  void verify_isIdempotentForAlreadyVerifiedUsers() {
    User verified = unverifiedUser(7L, "tiago@example.com");
    verified.setEmailVerified(true);
    String token = jwtTokenService.generateOneTimeToken(
        verified, TokenPurpose.EMAIL_VERIFICATION, tokenProperties.getVerificationTtlMinutes());
    when(userRepository.findById(7L)).thenReturn(Optional.of(verified));

    handler.verify(new VerifyEmailCommand(token));

    verify(userRepository, never()).save(any(User.class));
  }

  @Test
  void verify_rejectsTokenMintedForAnotherPurpose() {
    User unverified = unverifiedUser(7L, "tiago@example.com");
    String resetToken = jwtTokenService.generateOneTimeToken(
        unverified, TokenPurpose.PASSWORD_RESET, tokenProperties.getResetTtlMinutes());

    assertThatThrownBy(() -> handler.verify(new VerifyEmailCommand(resetToken)))
        .isInstanceOf(UnauthorizedException.class);
  }

  @Test
  void verify_rejectsMalformedToken() {
    assertThatThrownBy(() -> handler.verify(new VerifyEmailCommand("garbage-token")))
        .isInstanceOf(UnauthorizedException.class);
  }

  @Test
  void resendVerification_publishesForUnverifiedExistingUser() {
    User unverified = unverifiedUser(7L, "tiago@example.com");
    when(userRepository.findByEmail("tiago@example.com")).thenReturn(Optional.of(unverified));

    handler.resendVerification(new ResendVerificationCommand("tiago@example.com"));

    ArgumentCaptor<UserRegisteredEvent> captor =
        ArgumentCaptor.forClass(UserRegisteredEvent.class);
    verify(eventPublisher).publishEvent(captor.capture());
    assertThat(captor.getValue().userId()).isEqualTo(7L);
  }

  @Test
  void resendVerification_publishesNothingForVerifiedUser() {
    User verified = unverifiedUser(7L, "tiago@example.com");
    verified.setEmailVerified(true);
    when(userRepository.findByEmail("tiago@example.com")).thenReturn(Optional.of(verified));

    handler.resendVerification(new ResendVerificationCommand("tiago@example.com"));

    verify(eventPublisher, never()).publishEvent(any(UserRegisteredEvent.class));
  }

  @Test
  void resendVerification_publishesNothingForUnknownEmail() {
    when(userRepository.findByEmail("ghost@example.com")).thenReturn(Optional.empty());

    handler.resendVerification(new ResendVerificationCommand("ghost@example.com"));

    verify(eventPublisher, never()).publishEvent(any(UserRegisteredEvent.class));
  }

  private User unverifiedUser(Long id, String email) {
    User user = new User();
    user.setId(id);
    user.setFullName("Tiago Cunha");
    user.setEmail(email);
    user.setPasswordHash(passwordHashService.encodeIfNeeded("raw-password"));
    user.setEmailVerified(false);
    return user;
  }
}
