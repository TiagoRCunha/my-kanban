package com.tiagorcunha.mykanban.backend.user.application.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.tiagorcunha.mykanban.backend.common.infrastructure.security.AuthenticatedUserProvider;
import com.tiagorcunha.mykanban.backend.user.application.port.out.UserConfigRepositoryPort;
import com.tiagorcunha.mykanban.backend.user.application.port.out.UserCustomTagRepositoryPort;
import com.tiagorcunha.mykanban.backend.user.application.port.out.UserRepositoryPort;
import com.tiagorcunha.mykanban.backend.user.application.port.out.UserStartupColumnRepositoryPort;
import com.tiagorcunha.mykanban.backend.user.domain.model.User;
import com.tiagorcunha.mykanban.backend.user.domain.model.UserCustomTag;
import com.tiagorcunha.mykanban.backend.user.domain.model.UserRole;

@ExtendWith(MockitoExtension.class)
class UserConfigUseCaseHandlerTest {

  @Mock
  private UserConfigRepositoryPort userConfigRepository;
  @Mock
  private UserStartupColumnRepositoryPort startupColumnRepository;
  @Mock
  private UserCustomTagRepositoryPort customTagRepository;
  @Mock
  private UserRepositoryPort userRepository;
  @Mock
  private AuthenticatedUserProvider authenticatedUserProvider;

  private UserConfigUseCaseHandler handler;

  private User currentUser;

  @BeforeEach
  void setUp() {
    handler = new UserConfigUseCaseHandler(
        userConfigRepository, startupColumnRepository, customTagRepository,
        userRepository, authenticatedUserProvider);

    currentUser = new User();
    currentUser.setId(1L);
    currentUser.setRole(UserRole.USER);
  }

  @Test
  void delete_reindexesRemainingCustomTagPositionsToCloseGaps() {
    when(authenticatedUserProvider.getAuthenticatedUser()).thenReturn(currentUser);

    UserCustomTag toDelete = createTag(10L, 1);
    when(customTagRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(toDelete));

    // Remaining tags contain a gap: positions 0, 2 and 4 (1 was deleted).
    UserCustomTag tag0 = createTag(11L, 0);
    UserCustomTag tag2 = createTag(12L, 2);
    UserCustomTag tag4 = createTag(13L, 4);
    when(customTagRepository.findByUserIdOrderByPositionAsc(1L))
        .thenReturn(List.of(tag0, tag2, tag4));

    handler.delete(1L, 10L);

    verify(customTagRepository).delete(toDelete);
    // First pass moves every tag out of the way, second pass assigns final positions.
    verify(customTagRepository, times(2)).saveAll(any());
    verify(customTagRepository).flush();

    assertThat(tag0.getPosition()).isEqualTo(0);
    assertThat(tag2.getPosition()).isEqualTo(1);
    assertThat(tag4.getPosition()).isEqualTo(2);
  }

  @Test
  void delete_doesNothingWhenNoRemainingTags() {
    when(authenticatedUserProvider.getAuthenticatedUser()).thenReturn(currentUser);

    UserCustomTag toDelete = createTag(10L, 0);
    when(customTagRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(toDelete));
    when(customTagRepository.findByUserIdOrderByPositionAsc(1L)).thenReturn(List.of());

    handler.delete(1L, 10L);

    verify(customTagRepository).delete(toDelete);
    verify(customTagRepository, times(0)).saveAll(any());
    verify(customTagRepository, times(0)).flush();
  }

  private UserCustomTag createTag(Long id, Integer position) {
    UserCustomTag tag = new UserCustomTag();
    tag.setId(id);
    tag.setPosition(position);
    return tag;
  }
}
