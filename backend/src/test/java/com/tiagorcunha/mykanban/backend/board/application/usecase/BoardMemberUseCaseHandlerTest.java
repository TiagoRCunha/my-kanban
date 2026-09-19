package com.tiagorcunha.mykanban.backend.board.application.usecase;

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
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.tiagorcunha.mykanban.backend.board.application.command.InviteBoardMemberCommand;
import com.tiagorcunha.mykanban.backend.board.application.command.UpdateBoardMemberRoleCommand;
import com.tiagorcunha.mykanban.backend.board.application.port.out.BoardMemberRepositoryPort;
import com.tiagorcunha.mykanban.backend.board.application.port.out.BoardRepositoryPort;
import com.tiagorcunha.mykanban.backend.board.application.response.BoardMemberResponse;
import com.tiagorcunha.mykanban.backend.board.domain.model.Board;
import com.tiagorcunha.mykanban.backend.board.domain.model.BoardMember;
import com.tiagorcunha.mykanban.backend.board.domain.model.BoardMemberRole;
import com.tiagorcunha.mykanban.backend.common.application.exception.ConflictException;
import com.tiagorcunha.mykanban.backend.common.application.exception.ForbiddenException;
import com.tiagorcunha.mykanban.backend.common.application.exception.ResourceNotFoundException;
import com.tiagorcunha.mykanban.backend.common.infrastructure.security.AuthenticatedUserProvider;
import com.tiagorcunha.mykanban.backend.user.application.port.out.UserRepositoryPort;
import com.tiagorcunha.mykanban.backend.user.domain.model.User;
import com.tiagorcunha.mykanban.backend.user.domain.model.UserRole;

@ExtendWith(MockitoExtension.class)
class BoardMemberUseCaseHandlerTest {

  @Mock
  private BoardMemberRepositoryPort boardMemberRepository;
  @Mock
  private BoardRepositoryPort boardRepository;
  @Mock
  private UserRepositoryPort userRepository;
  @Mock
  private AuthenticatedUserProvider authenticatedUserProvider;

  private BoardAuthorizationService authorizationService;
  private BoardMemberUseCaseHandler handler;

  private User ownerUser;
  private User invitedUser;
  private Board board;

  @BeforeEach
  void setUp() {
    authorizationService = new BoardAuthorizationService(boardMemberRepository);
    handler = new BoardMemberUseCaseHandler(
        boardMemberRepository, boardRepository, userRepository, authenticatedUserProvider, authorizationService);

    ownerUser = new User();
    ownerUser.setId(1L);
    ownerUser.setEmail("owner@example.com");
    ownerUser.setFullName("Owner User");
    ownerUser.setRole(UserRole.USER);

    invitedUser = new User();
    invitedUser.setId(2L);
    invitedUser.setEmail("invited@example.com");
    invitedUser.setFullName("Invited User");
    invitedUser.setRole(UserRole.USER);

    board = new Board();
    board.setId(10L);
    board.setOwner(ownerUser);
  }

  @Test
  void listMembers_returnsAllMembersForBoard() {
    when(authenticatedUserProvider.getAuthenticatedUser()).thenReturn(ownerUser);
    when(boardRepository.findById(10L)).thenReturn(Optional.of(board));

    BoardMember member = createMember(100L, invitedUser, BoardMemberRole.GUEST);
    when(boardMemberRepository.findAllByBoardId(10L)).thenReturn(List.of(member));

    List<BoardMemberResponse> result = handler.listMembers(10L);

    assertThat(result).hasSize(1);
    assertThat(result.get(0).email()).isEqualTo("invited@example.com");
    assertThat(result.get(0).role()).isEqualTo("GUEST");
  }

  @Test
  void listMembers_throwsWhenBoardNotFound() {
    when(authenticatedUserProvider.getAuthenticatedUser()).thenReturn(ownerUser);
    when(boardRepository.findById(10L)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> handler.listMembers(10L))
        .isInstanceOf(ResourceNotFoundException.class);
  }

  @Test
  void listMembers_throwsWhenNotOwnerOrAdmin() {
    User regularUser = new User();
    regularUser.setId(99L);
    regularUser.setRole(UserRole.USER);

    when(authenticatedUserProvider.getAuthenticatedUser()).thenReturn(regularUser);
    when(boardRepository.findById(10L)).thenReturn(Optional.of(board));

    assertThatThrownBy(() -> handler.listMembers(10L))
        .isInstanceOf(ForbiddenException.class);
  }

  @Test
  void inviteMember_createsNewMemberWithRole() {
    when(authenticatedUserProvider.getAuthenticatedUser()).thenReturn(ownerUser);
    when(boardRepository.findById(10L)).thenReturn(Optional.of(board));
    when(userRepository.findByEmail("invited@example.com")).thenReturn(Optional.of(invitedUser));
    when(boardMemberRepository.findByBoardIdAndUserId(10L, 2L)).thenReturn(Optional.empty());
    when(boardMemberRepository.save(any(BoardMember.class))).thenAnswer(invocation -> {
      BoardMember m = invocation.getArgument(0);
      m.setId(200L);
      return m;
    });

    InviteBoardMemberCommand command = new InviteBoardMemberCommand("invited@example.com", "GUEST");
    BoardMemberResponse response = handler.inviteMember(10L, command);

    assertThat(response.email()).isEqualTo("invited@example.com");
    assertThat(response.role()).isEqualTo("GUEST");
    assertThat(response.boardId()).isEqualTo(10L);
    verify(boardMemberRepository).save(any(BoardMember.class));
  }

  @Test
  void inviteMember_throwsWhenUserNotFound() {
    when(authenticatedUserProvider.getAuthenticatedUser()).thenReturn(ownerUser);
    when(boardRepository.findById(10L)).thenReturn(Optional.of(board));
    when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

    InviteBoardMemberCommand command = new InviteBoardMemberCommand("unknown@example.com", "GUEST");

    assertThatThrownBy(() -> handler.inviteMember(10L, command))
        .isInstanceOf(ResourceNotFoundException.class);
  }

  @Test
  void inviteMember_throwsWhenInvitingSelf() {
    when(authenticatedUserProvider.getAuthenticatedUser()).thenReturn(ownerUser);
    when(boardRepository.findById(10L)).thenReturn(Optional.of(board));
    when(userRepository.findByEmail("owner@example.com")).thenReturn(Optional.of(ownerUser));

    InviteBoardMemberCommand command = new InviteBoardMemberCommand("owner@example.com", "GUEST");

    assertThatThrownBy(() -> handler.inviteMember(10L, command))
        .isInstanceOf(ConflictException.class)
        .hasMessageContaining("cannot invite yourself");
  }

  @Test
  void inviteMember_throwsWhenAlreadyMember() {
    when(authenticatedUserProvider.getAuthenticatedUser()).thenReturn(ownerUser);
    when(boardRepository.findById(10L)).thenReturn(Optional.of(board));
    when(userRepository.findByEmail("invited@example.com")).thenReturn(Optional.of(invitedUser));
    BoardMember existingMember = createMember(100L, invitedUser, BoardMemberRole.GUEST);
    when(boardMemberRepository.findByBoardIdAndUserId(10L, 2L)).thenReturn(Optional.of(existingMember));

    InviteBoardMemberCommand command = new InviteBoardMemberCommand("invited@example.com", "GUEST");

    assertThatThrownBy(() -> handler.inviteMember(10L, command))
        .isInstanceOf(ConflictException.class)
        .hasMessageContaining("already a member");
  }

  @Test
  void inviteMember_throwsWhenInvalidRole() {
    when(authenticatedUserProvider.getAuthenticatedUser()).thenReturn(ownerUser);
    when(boardRepository.findById(10L)).thenReturn(Optional.of(board));
    when(userRepository.findByEmail("invited@example.com")).thenReturn(Optional.of(invitedUser));
    when(boardMemberRepository.findByBoardIdAndUserId(10L, 2L)).thenReturn(Optional.empty());

    InviteBoardMemberCommand command = new InviteBoardMemberCommand("invited@example.com", "INVALID_ROLE");

    assertThatThrownBy(() -> handler.inviteMember(10L, command))
        .isInstanceOf(ConflictException.class)
        .hasMessageContaining("Invalid role");
  }

  @Test
  void updateMemberRole_updatesRole() {
    when(authenticatedUserProvider.getAuthenticatedUser()).thenReturn(ownerUser);
    when(boardRepository.findById(10L)).thenReturn(Optional.of(board));

    BoardMember member = createMember(200L, invitedUser, BoardMemberRole.GUEST);
    when(boardMemberRepository.findById(200L)).thenReturn(Optional.of(member));
    when(boardMemberRepository.save(any(BoardMember.class))).thenAnswer(inv -> inv.getArgument(0));

    UpdateBoardMemberRoleCommand command = new UpdateBoardMemberRoleCommand("VIEW_ONLY");
    BoardMemberResponse response = handler.updateMemberRole(10L, 200L, command);

    assertThat(response.role()).isEqualTo("VIEW_ONLY");
    verify(boardMemberRepository).save(member);
  }

  @Test
  void updateMemberRole_throwsWhenMemberNotFound() {
    when(authenticatedUserProvider.getAuthenticatedUser()).thenReturn(ownerUser);
    when(boardRepository.findById(10L)).thenReturn(Optional.of(board));
    when(boardMemberRepository.findById(999L)).thenReturn(Optional.empty());

    UpdateBoardMemberRoleCommand command = new UpdateBoardMemberRoleCommand("GUEST");

    assertThatThrownBy(() -> handler.updateMemberRole(10L, 999L, command))
        .isInstanceOf(ResourceNotFoundException.class);
  }

  @Test
  void updateMemberRole_throwsWhenMemberNotOnBoard() {
    when(authenticatedUserProvider.getAuthenticatedUser()).thenReturn(ownerUser);
    when(boardRepository.findById(10L)).thenReturn(Optional.of(board));

    Board board2 = new Board();
    board2.setId(20L);
    board2.setOwner(ownerUser);

    BoardMember member = createMember(200L, invitedUser, BoardMemberRole.GUEST);
    member.setBoard(board2);
    when(boardMemberRepository.findById(200L)).thenReturn(Optional.of(member));

    UpdateBoardMemberRoleCommand command = new UpdateBoardMemberRoleCommand("GUEST");

    assertThatThrownBy(() -> handler.updateMemberRole(10L, 200L, command))
        .isInstanceOf(ResourceNotFoundException.class);
  }

  @Test
  void removeMember_deletesMember() {
    when(authenticatedUserProvider.getAuthenticatedUser()).thenReturn(ownerUser);
    when(boardRepository.findById(10L)).thenReturn(Optional.of(board));

    BoardMember member = createMember(200L, invitedUser, BoardMemberRole.GUEST);
    when(boardMemberRepository.findById(200L)).thenReturn(Optional.of(member));

    handler.removeMember(10L, 200L);

    verify(boardMemberRepository).delete(member);
  }

  @Test
  void removeMember_throwsWhenMemberNotFound() {
    when(authenticatedUserProvider.getAuthenticatedUser()).thenReturn(ownerUser);
    when(boardRepository.findById(10L)).thenReturn(Optional.of(board));
    when(boardMemberRepository.findById(999L)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> handler.removeMember(10L, 999L))
        .isInstanceOf(ResourceNotFoundException.class);
  }

  @Test
  void removeMember_throwsWhenMemberNotOnBoard() {
    when(authenticatedUserProvider.getAuthenticatedUser()).thenReturn(ownerUser);
    when(boardRepository.findById(10L)).thenReturn(Optional.of(board));

    Board board2 = new Board();
    board2.setId(20L);
    board2.setOwner(ownerUser);

    BoardMember member = createMember(200L, invitedUser, BoardMemberRole.GUEST);
    member.setBoard(board2);
    when(boardMemberRepository.findById(200L)).thenReturn(Optional.of(member));

    assertThatThrownBy(() -> handler.removeMember(10L, 200L))
        .isInstanceOf(ResourceNotFoundException.class);
    verify(boardMemberRepository, never()).delete(any());
  }

  @Test
  void inviteMember_throwsWhenAssigningOwnerRole() {
    when(authenticatedUserProvider.getAuthenticatedUser()).thenReturn(ownerUser);
    when(boardRepository.findById(10L)).thenReturn(Optional.of(board));
    when(userRepository.findByEmail("invited@example.com")).thenReturn(Optional.of(invitedUser));
    when(boardMemberRepository.findByBoardIdAndUserId(10L, 2L)).thenReturn(Optional.empty());

    InviteBoardMemberCommand command = new InviteBoardMemberCommand("invited@example.com", "OWNER");

    assertThatThrownBy(() -> handler.inviteMember(10L, command))
        .isInstanceOf(ConflictException.class)
        .hasMessageContaining("cannot be assigned");
    verify(boardMemberRepository, never()).save(any(BoardMember.class));
  }

  @Test
  void updateMemberRole_throwsWhenAssigningOwnerRole() {
    when(authenticatedUserProvider.getAuthenticatedUser()).thenReturn(ownerUser);
    when(boardRepository.findById(10L)).thenReturn(Optional.of(board));

    BoardMember member = createMember(200L, invitedUser, BoardMemberRole.GUEST);
    when(boardMemberRepository.findById(200L)).thenReturn(Optional.of(member));

    UpdateBoardMemberRoleCommand command = new UpdateBoardMemberRoleCommand("OWNER");

    assertThatThrownBy(() -> handler.updateMemberRole(10L, 200L, command))
        .isInstanceOf(ConflictException.class)
        .hasMessageContaining("cannot be assigned");
    verify(boardMemberRepository, never()).save(any(BoardMember.class));
  }

  @Test
  void listMembers_memberCanViewMemberList() {
    User memberUser = new User();
    memberUser.setId(3L);
    memberUser.setRole(UserRole.USER);

    BoardMember memberRow = createMember(300L, memberUser, BoardMemberRole.VIEW_ONLY);
    when(authenticatedUserProvider.getAuthenticatedUser()).thenReturn(memberUser);
    when(boardRepository.findById(10L)).thenReturn(Optional.of(board));
    when(boardMemberRepository.findByBoardIdAndUserId(10L, 3L)).thenReturn(Optional.of(memberRow));
    when(boardMemberRepository.findAllByBoardId(10L))
        .thenReturn(List.of(createMember(100L, invitedUser, BoardMemberRole.GUEST)));

    List<BoardMemberResponse> result = handler.listMembers(10L);

    assertThat(result).hasSize(1);
    assertThat(result.get(0).role()).isEqualTo("GUEST");
  }

  @Test
  void inviteMember_superAdminCanInviteToAnyBoard() {
    User superAdmin = new User();
    superAdmin.setId(50L);
    superAdmin.setRole(UserRole.SUPER_ADMIN);

    when(authenticatedUserProvider.getAuthenticatedUser()).thenReturn(superAdmin);
    when(boardRepository.findById(10L)).thenReturn(Optional.of(board));
    when(userRepository.findByEmail("invited@example.com")).thenReturn(Optional.of(invitedUser));
    when(boardMemberRepository.findByBoardIdAndUserId(10L, 2L)).thenReturn(Optional.empty());
    when(boardMemberRepository.save(any(BoardMember.class))).thenAnswer(invocation -> {
      BoardMember m = invocation.getArgument(0);
      m.setId(300L);
      return m;
    });

    InviteBoardMemberCommand command = new InviteBoardMemberCommand("invited@example.com", "VIEW_ONLY");
    BoardMemberResponse response = handler.inviteMember(10L, command);

    assertThat(response.role()).isEqualTo("VIEW_ONLY");
  }

  private BoardMember createMember(Long id, User user, BoardMemberRole role) {
    BoardMember member = new BoardMember();
    member.setId(id);
    member.setBoard(board);
    member.setUser(user);
    member.setRole(role);
    return member;
  }
}
