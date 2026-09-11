package com.tiagorcunha.mykanban.backend.user.application.usecase;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tiagorcunha.mykanban.backend.common.application.exception.ConflictException;
import com.tiagorcunha.mykanban.backend.common.application.exception.ForbiddenException;
import com.tiagorcunha.mykanban.backend.common.application.exception.ResourceNotFoundException;
import com.tiagorcunha.mykanban.backend.common.application.exception.UnauthorizedException;
import com.tiagorcunha.mykanban.backend.common.infrastructure.security.AuthenticatedUserProvider;
import com.tiagorcunha.mykanban.backend.common.infrastructure.security.JwtTokenService;
import com.tiagorcunha.mykanban.backend.common.infrastructure.security.PasswordHashService;
import com.tiagorcunha.mykanban.backend.common.infrastructure.security.TokenProperties;
import com.tiagorcunha.mykanban.backend.common.infrastructure.security.TokenPurpose;
import com.tiagorcunha.mykanban.backend.user.application.command.ResendVerificationCommand;
import com.tiagorcunha.mykanban.backend.user.application.command.SaveUserCommand;
import com.tiagorcunha.mykanban.backend.user.application.command.VerifyEmailCommand;
import com.tiagorcunha.mykanban.backend.user.application.mapper.UserResponseMapper;
import com.tiagorcunha.mykanban.backend.user.application.port.in.CreateUserUseCase;
import com.tiagorcunha.mykanban.backend.user.application.port.in.DeleteUserUseCase;
import com.tiagorcunha.mykanban.backend.user.application.port.in.FindUserByIdUseCase;
import com.tiagorcunha.mykanban.backend.user.application.port.in.ListUsersUseCase;
import com.tiagorcunha.mykanban.backend.user.application.port.in.ResendVerificationUseCase;
import com.tiagorcunha.mykanban.backend.user.application.port.in.UpdateUserUseCase;
import com.tiagorcunha.mykanban.backend.user.application.port.in.VerifyEmailUseCase;
import com.tiagorcunha.mykanban.backend.user.application.port.out.UserConfigRepositoryPort;
import com.tiagorcunha.mykanban.backend.user.application.port.out.UserCustomTagRepositoryPort;
import com.tiagorcunha.mykanban.backend.user.application.port.out.UserRepositoryPort;
import com.tiagorcunha.mykanban.backend.user.application.port.out.UserStartupColumnRepositoryPort;
import com.tiagorcunha.mykanban.backend.user.application.response.UserResponse;
import com.tiagorcunha.mykanban.backend.user.domain.event.UserRegisteredEvent;
import com.tiagorcunha.mykanban.backend.user.domain.model.User;
import com.tiagorcunha.mykanban.backend.user.domain.model.UserConfig;
import com.tiagorcunha.mykanban.backend.user.domain.model.UserCustomTag;
import com.tiagorcunha.mykanban.backend.user.domain.model.UserRole;
import com.tiagorcunha.mykanban.backend.user.domain.model.UserStartupColumn;

import io.jsonwebtoken.JwtException;

@Service
public class UserUseCaseHandler
    implements
      ListUsersUseCase,
      FindUserByIdUseCase,
      CreateUserUseCase,
      UpdateUserUseCase,
      DeleteUserUseCase,
      VerifyEmailUseCase,
      ResendVerificationUseCase {

  private final UserRepositoryPort userRepository;
  private final PasswordHashService passwordHashService;
  private final AuthenticatedUserProvider authenticatedUserProvider;
  private final UserConfigRepositoryPort userConfigRepository;
  private final UserStartupColumnRepositoryPort startupColumnRepository;
  private final UserCustomTagRepositoryPort customTagRepository;
  private final ApplicationEventPublisher eventPublisher;
  private final JwtTokenService jwtTokenService;
  private final TokenProperties tokenProperties;

  public UserUseCaseHandler(
      UserRepositoryPort userRepository,
      PasswordHashService passwordHashService,
      AuthenticatedUserProvider authenticatedUserProvider,
      UserConfigRepositoryPort userConfigRepository,
      UserStartupColumnRepositoryPort startupColumnRepository,
      UserCustomTagRepositoryPort customTagRepository,
      ApplicationEventPublisher eventPublisher,
      JwtTokenService jwtTokenService,
      TokenProperties tokenProperties) {
    this.userRepository = userRepository;
    this.passwordHashService = passwordHashService;
    this.authenticatedUserProvider = authenticatedUserProvider;
    this.userConfigRepository = userConfigRepository;
    this.startupColumnRepository = startupColumnRepository;
    this.customTagRepository = customTagRepository;
    this.eventPublisher = eventPublisher;
    this.jwtTokenService = jwtTokenService;
    this.tokenProperties = tokenProperties;
  }

  @Override
  @Transactional(readOnly = true)
  public List<UserResponse> findAll() {
    return userRepository.findAll().stream()
        .map(UserResponseMapper::toResponse)
        .toList();
  }

  @Override
  @Transactional(readOnly = true)
  public UserResponse findById(Long id) {
    return UserResponseMapper.toResponse(getExistingUser(id));
  }

  @Override
  @Transactional
  public UserResponse create(SaveUserCommand command) {
    if (userRepository.existsByEmail(command.email())) {
      throw new ConflictException("Email already in use");
    }

    LocalDateTime now = LocalDateTime.now();
    User user = new User();
    user.setFullName(command.fullName());
    user.setEmail(command.email());
    user.setPasswordHash(passwordHashService.encodeIfNeeded(command.passwordHash()));
    user.setAvatarUrl(command.avatarUrl());
    user.setRole(UserRole.USER);
    // Explicitly unverified self-registrations must confirm their email first.
    // A null/true value (admin-created users) means the account is trusted.
    user.setEmailVerified(command.emailVerified() == null || command.emailVerified());
    user.setCreatedAt(now);
    user.setUpdatedAt(now);

    User savedUser = userRepository.save(user);

    // Seed default user config
    UserConfig config = new UserConfig();
    config.setUser(savedUser);
    config.setDarkMode(false);
    config.setCreatedAt(now);
    config.setUpdatedAt(now);
    userConfigRepository.save(config);

    // Seed default startup columns
    String[] defaultColumnTitles = { "Backlog", "In Progress", "Testing", "Done" };
    String[] defaultColumnTypes = { "ARCHIVE", "NORMAL", "NORMAL", "DONE" };
    List<UserStartupColumn> startupColumns = new java.util.ArrayList<>();
    for (int i = 0; i < defaultColumnTitles.length; i++) {
      UserStartupColumn col = new UserStartupColumn();
      col.setUser(savedUser);
      col.setTitle(defaultColumnTitles[i]);
      col.setPosition(i);
      col.setType(defaultColumnTypes[i]);
      col.setCreatedAt(now);
      startupColumns.add(col);
    }
    startupColumnRepository.saveAll(startupColumns);

    // Seed default custom tags
    String[][] defaultTags = {
        { "EASY", "#4CAF50" },
        { "MEDIUM", "#FFC107" },
        { "HARD", "#F44336" }
    };
    for (int i = 0; i < defaultTags.length; i++) {
      UserCustomTag tag = new UserCustomTag();
      tag.setUser(savedUser);
      tag.setName(defaultTags[i][0]);
      tag.setColor(defaultTags[i][1]);
      tag.setPosition(i);
      tag.setCreatedAt(now);
      customTagRepository.save(tag);
    }

    if (!savedUser.isEmailVerified()) {
      publishRegistrationEmail(savedUser);
    }

    return UserResponseMapper.toResponse(savedUser);
  }

  @Override
  @Transactional
  public UserResponse update(Long id, SaveUserCommand command) {
    assertCanManageUser(id);
    User user = getExistingUser(id);

    userRepository.findByEmail(command.email())
        .filter(other -> !other.getId().equals(id))
        .ifPresent(other -> {
          throw new ConflictException("Email already in use");
        });

    user.setFullName(command.fullName());
    user.setEmail(command.email());
    user.setPasswordHash(passwordHashService.encodeIfNeeded(command.passwordHash()));
    user.setAvatarUrl(command.avatarUrl());
    user.setUpdatedAt(LocalDateTime.now());

    return UserResponseMapper.toResponse(userRepository.save(user));
  }

  @Override
  @Transactional
  public void delete(Long id) {
    assertCanManageUser(id);
    if (!userRepository.existsById(id)) {
      throw new ResourceNotFoundException("User not found");
    }
    userRepository.deleteById(id);
  }

  @Override
  @Transactional
  public void verify(VerifyEmailCommand command) {
    Long userId = extractUserId(command.token());
    User user = getExistingUser(userId);

    if (!user.isEmailVerified()) {
      user.setEmailVerified(true);
      user.setUpdatedAt(LocalDateTime.now());
      userRepository.save(user);
    }
  }

  @Override
  @Transactional
  public void resendVerification(ResendVerificationCommand command) {
    userRepository.findByEmail(command.email())
        .filter(user -> !user.isEmailVerified())
        .ifPresent(this::publishRegistrationEmail);
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private void publishRegistrationEmail(User user) {
    String verificationToken = jwtTokenService.generateOneTimeToken(
        user,
        TokenPurpose.EMAIL_VERIFICATION,
        tokenProperties.getVerificationTtlMinutes());

    eventPublisher.publishEvent(new UserRegisteredEvent(
        user.getId(),
        user.getEmail(),
        user.getFullName(),
        verificationToken));
  }

  /**
   * Parses the token and returns the user id it references, or throws 401 when
   * the token is malformed, expired, or was minted for a different purpose.
   */
  private Long extractUserId(String token) {
    try {
      if (!jwtTokenService.isTokenValidForPurpose(token, TokenPurpose.EMAIL_VERIFICATION)) {
        throw new UnauthorizedException("Invalid or expired verification link");
      }
      return jwtTokenService.extractUserId(token);
    } catch (JwtException | IllegalArgumentException exception) {
      throw new UnauthorizedException("Invalid or expired verification link");
    }
  }

  private void assertCanManageUser(Long requestedUserId) {
    User currentUser = authenticatedUserProvider.getAuthenticatedUser();
    if (currentUser.getRole().isSuperAdmin()) {
      return;
    }
    if (!currentUser.getId().equals(requestedUserId)) {
      throw new ForbiddenException("You can only manage your own user account");
    }
  }

  private User getExistingUser(Long id) {
    return userRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("User not found"));
  }

}
