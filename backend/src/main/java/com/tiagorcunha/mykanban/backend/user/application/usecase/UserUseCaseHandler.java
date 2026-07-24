package com.tiagorcunha.mykanban.backend.user.application.usecase;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tiagorcunha.mykanban.backend.common.application.exception.ConflictException;
import com.tiagorcunha.mykanban.backend.common.application.exception.ForbiddenException;
import com.tiagorcunha.mykanban.backend.common.application.exception.ResourceNotFoundException;
import com.tiagorcunha.mykanban.backend.common.infrastructure.security.AuthenticatedUserProvider;
import com.tiagorcunha.mykanban.backend.common.infrastructure.security.PasswordHashService;
import com.tiagorcunha.mykanban.backend.user.application.command.SaveUserCommand;
import com.tiagorcunha.mykanban.backend.user.application.mapper.UserResponseMapper;
import com.tiagorcunha.mykanban.backend.user.application.port.in.CreateUserUseCase;
import com.tiagorcunha.mykanban.backend.user.application.port.in.DeleteUserUseCase;
import com.tiagorcunha.mykanban.backend.user.application.port.in.FindUserByIdUseCase;
import com.tiagorcunha.mykanban.backend.user.application.port.in.ListUsersUseCase;
import com.tiagorcunha.mykanban.backend.user.application.port.in.UpdateUserUseCase;
import com.tiagorcunha.mykanban.backend.user.application.port.out.UserRepositoryPort;
import com.tiagorcunha.mykanban.backend.user.application.response.UserResponse;
import com.tiagorcunha.mykanban.backend.user.domain.model.User;
import com.tiagorcunha.mykanban.backend.user.domain.model.UserRole;

@Service
public class UserUseCaseHandler
    implements ListUsersUseCase, FindUserByIdUseCase, CreateUserUseCase, UpdateUserUseCase, DeleteUserUseCase {

  private final UserRepositoryPort userRepository;
  private final PasswordHashService passwordHashService;
  private final AuthenticatedUserProvider authenticatedUserProvider;

  public UserUseCaseHandler(
      UserRepositoryPort userRepository,
      PasswordHashService passwordHashService,
      AuthenticatedUserProvider authenticatedUserProvider) {
    this.userRepository = userRepository;
    this.passwordHashService = passwordHashService;
    this.authenticatedUserProvider = authenticatedUserProvider;
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
    user.setCreatedAt(now);
    user.setUpdatedAt(now);

    return UserResponseMapper.toResponse(userRepository.save(user));
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