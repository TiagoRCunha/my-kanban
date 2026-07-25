package com.tiagorcunha.mykanban.backend.user.application.usecase;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tiagorcunha.mykanban.backend.common.application.exception.ConflictException;
import com.tiagorcunha.mykanban.backend.common.application.exception.ForbiddenException;
import com.tiagorcunha.mykanban.backend.common.application.exception.ResourceNotFoundException;
import com.tiagorcunha.mykanban.backend.common.infrastructure.security.AuthenticatedUserProvider;
import com.tiagorcunha.mykanban.backend.user.application.command.SaveCustomTagCommand;
import com.tiagorcunha.mykanban.backend.user.application.command.SaveStartupColumnCommand;
import com.tiagorcunha.mykanban.backend.user.application.command.SaveUserConfigCommand;
import com.tiagorcunha.mykanban.backend.user.application.mapper.CustomTagResponseMapper;
import com.tiagorcunha.mykanban.backend.user.application.mapper.StartupColumnResponseMapper;
import com.tiagorcunha.mykanban.backend.user.application.mapper.UserConfigResponseMapper;
import com.tiagorcunha.mykanban.backend.user.application.port.in.CreateCustomTagUseCase;
import com.tiagorcunha.mykanban.backend.user.application.port.in.DeleteCustomTagUseCase;
import com.tiagorcunha.mykanban.backend.user.application.port.in.GetUserConfigUseCase;
import com.tiagorcunha.mykanban.backend.user.application.port.in.ListCustomTagsUseCase;
import com.tiagorcunha.mykanban.backend.user.application.port.in.ListStartupColumnsUseCase;
import com.tiagorcunha.mykanban.backend.user.application.port.in.SaveStartupColumnsUseCase;
import com.tiagorcunha.mykanban.backend.user.application.port.in.UpdateCustomTagUseCase;
import com.tiagorcunha.mykanban.backend.user.application.port.in.UpdateUserConfigUseCase;
import com.tiagorcunha.mykanban.backend.user.application.port.out.UserConfigRepositoryPort;
import com.tiagorcunha.mykanban.backend.user.application.port.out.UserCustomTagRepositoryPort;
import com.tiagorcunha.mykanban.backend.user.application.port.out.UserStartupColumnRepositoryPort;
import com.tiagorcunha.mykanban.backend.user.application.port.out.UserRepositoryPort;
import com.tiagorcunha.mykanban.backend.user.application.response.CustomTagResponse;
import com.tiagorcunha.mykanban.backend.user.application.response.StartupColumnResponse;
import com.tiagorcunha.mykanban.backend.user.application.response.UserConfigResponse;
import com.tiagorcunha.mykanban.backend.user.domain.model.User;
import com.tiagorcunha.mykanban.backend.user.domain.model.UserConfig;
import com.tiagorcunha.mykanban.backend.user.domain.model.UserCustomTag;
import com.tiagorcunha.mykanban.backend.user.domain.model.UserStartupColumn;

@Service
public class UserConfigUseCaseHandler
    implements
      GetUserConfigUseCase,
      UpdateUserConfigUseCase,
      ListStartupColumnsUseCase,
      SaveStartupColumnsUseCase,
      ListCustomTagsUseCase,
      CreateCustomTagUseCase,
      UpdateCustomTagUseCase,
      DeleteCustomTagUseCase {

  private final UserConfigRepositoryPort userConfigRepository;
  private final UserStartupColumnRepositoryPort startupColumnRepository;
  private final UserCustomTagRepositoryPort customTagRepository;
  private final UserRepositoryPort userRepository;
  private final AuthenticatedUserProvider authenticatedUserProvider;

  public UserConfigUseCaseHandler(
      UserConfigRepositoryPort userConfigRepository,
      UserStartupColumnRepositoryPort startupColumnRepository,
      UserCustomTagRepositoryPort customTagRepository,
      UserRepositoryPort userRepository,
      AuthenticatedUserProvider authenticatedUserProvider) {
    this.userConfigRepository = userConfigRepository;
    this.startupColumnRepository = startupColumnRepository;
    this.customTagRepository = customTagRepository;
    this.userRepository = userRepository;
    this.authenticatedUserProvider = authenticatedUserProvider;
  }

  // ─── User Config ───────────────────────────────────────────────────────────

  @Override
  @Transactional(readOnly = true)
  public UserConfigResponse findByUserId(Long userId) {
    User currentUser = authenticatedUserProvider.getAuthenticatedUser();
    assertCanManageUser(currentUser, userId);

    UserConfig config = getOrCreateConfig(userId);
    List<UserStartupColumn> startupColumns =
        startupColumnRepository.findByUserIdOrderByPositionAsc(userId);
    List<UserCustomTag> customTags =
        customTagRepository.findByUserIdOrderByPositionAsc(userId);

    return UserConfigResponseMapper.toResponse(config, startupColumns, customTags);
  }

  @Override
  @Transactional
  public UserConfigResponse update(Long userId, SaveUserConfigCommand command) {
    User currentUser = authenticatedUserProvider.getAuthenticatedUser();
    assertCanManageUser(currentUser, userId);

    UserConfig config = getOrCreateConfig(userId);
    config.setDarkMode(command.darkMode());
    config.setUpdatedAt(LocalDateTime.now());
    userConfigRepository.save(config);

    List<UserStartupColumn> startupColumns =
        startupColumnRepository.findByUserIdOrderByPositionAsc(userId);
    List<UserCustomTag> customTags =
        customTagRepository.findByUserIdOrderByPositionAsc(userId);

    return UserConfigResponseMapper.toResponse(config, startupColumns, customTags);
  }

  // ─── Startup Columns ───────────────────────────────────────────────────────

  @Override
  @Transactional(readOnly = true)
  public List<StartupColumnResponse> findStartupColumnsByUserId(Long userId) {
    User currentUser = authenticatedUserProvider.getAuthenticatedUser();
    assertCanManageUser(currentUser, userId);

    return startupColumnRepository.findByUserIdOrderByPositionAsc(userId).stream()
        .map(StartupColumnResponseMapper::toResponse)
        .toList();
  }

  @Override
  @Transactional
  public List<StartupColumnResponse> saveAll(Long userId, List<SaveStartupColumnCommand> columns) {
    User currentUser = authenticatedUserProvider.getAuthenticatedUser();
    assertCanManageUser(currentUser, userId);

    User user = getExistingUser(userId);
    startupColumnRepository.deleteAllByUserId(userId);

    LocalDateTime now = LocalDateTime.now();
    List<UserStartupColumn> entities = columns.stream()
        .map(cmd -> {
          UserStartupColumn entity = new UserStartupColumn();
          entity.setUser(user);
          entity.setTitle(cmd.title());
          entity.setPosition(cmd.position());
          entity.setCreatedAt(now);
          return entity;
        })
        .toList();

    startupColumnRepository.saveAll(entities);

    return startupColumnRepository.findByUserIdOrderByPositionAsc(userId).stream()
        .map(StartupColumnResponseMapper::toResponse)
        .toList();
  }

  // ─── Custom Tags ───────────────────────────────────────────────────────────

  @Override
  @Transactional(readOnly = true)
  public List<CustomTagResponse> findCustomTagsByUserId(Long userId) {
    User currentUser = authenticatedUserProvider.getAuthenticatedUser();
    assertCanManageUser(currentUser, userId);

    return customTagRepository.findByUserIdOrderByPositionAsc(userId).stream()
        .map(CustomTagResponseMapper::toResponse)
        .toList();
  }

  @Override
  @Transactional
  public CustomTagResponse create(Long userId, SaveCustomTagCommand command) {
    User currentUser = authenticatedUserProvider.getAuthenticatedUser();
    assertCanManageUser(currentUser, userId);

    User user = getExistingUser(userId);

    if (customTagRepository.existsByUserIdAndPosition(userId, command.position())) {
      throw new ConflictException("Tag position already in use");
    }

    UserCustomTag tag = new UserCustomTag();
    tag.setUser(user);
    tag.setName(command.name());
    tag.setColor(command.color());
    tag.setPosition(command.position());
    tag.setCreatedAt(LocalDateTime.now());

    return CustomTagResponseMapper.toResponse(customTagRepository.save(tag));
  }

  @Override
  @Transactional
  public CustomTagResponse update(Long userId, Long tagId, SaveCustomTagCommand command) {
    User currentUser = authenticatedUserProvider.getAuthenticatedUser();
    assertCanManageUser(currentUser, userId);

    UserCustomTag tag = getExistingCustomTag(userId, tagId);

    if (customTagRepository.existsByUserIdAndPositionAndIdNot(userId, command.position(), tagId)) {
      throw new ConflictException("Tag position already in use");
    }

    tag.setName(command.name());
    tag.setColor(command.color());
    tag.setPosition(command.position());

    return CustomTagResponseMapper.toResponse(customTagRepository.save(tag));
  }

  @Override
  @Transactional
  public void delete(Long userId, Long tagId) {
    User currentUser = authenticatedUserProvider.getAuthenticatedUser();
    assertCanManageUser(currentUser, userId);

    UserCustomTag tag = getExistingCustomTag(userId, tagId);
    customTagRepository.delete(tag);
  }

  // ─── Private Helpers ───────────────────────────────────────────────────────

  private void assertCanManageUser(User currentUser, Long requestedUserId) {
    if (currentUser.getRole().isSuperAdmin()) {
      return;
    }
    if (!currentUser.getId().equals(requestedUserId)) {
      throw new ForbiddenException("You can only manage your own configuration");
    }
  }

  private UserConfig getOrCreateConfig(Long userId) {
    return userConfigRepository.findByUserId(userId).orElseGet(() -> {
      User user = getExistingUser(userId);
      LocalDateTime now = LocalDateTime.now();
      UserConfig config = new UserConfig();
      config.setUser(user);
      config.setDarkMode(false);
      config.setCreatedAt(now);
      config.setUpdatedAt(now);
      return userConfigRepository.save(config);
    });
  }

  private User getExistingUser(Long userId) {
    return userRepository.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("User not found"));
  }

  private UserCustomTag getExistingCustomTag(Long userId, Long tagId) {
    return customTagRepository.findByIdAndUserId(tagId, userId)
        .orElseThrow(() -> new ResourceNotFoundException("Custom tag not found"));
  }
}
