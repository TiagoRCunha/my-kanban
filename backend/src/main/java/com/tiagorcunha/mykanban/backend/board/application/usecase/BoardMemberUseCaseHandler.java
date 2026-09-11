package com.tiagorcunha.mykanban.backend.board.application.usecase;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tiagorcunha.mykanban.backend.board.application.command.InviteBoardMemberCommand;
import com.tiagorcunha.mykanban.backend.board.application.command.UpdateBoardMemberRoleCommand;
import com.tiagorcunha.mykanban.backend.board.application.port.in.BoardMemberUseCase;
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

@Service
public class BoardMemberUseCaseHandler implements BoardMemberUseCase {

  private final BoardMemberRepositoryPort boardMemberRepository;
  private final BoardRepositoryPort boardRepository;
  private final UserRepositoryPort userRepository;
  private final AuthenticatedUserProvider authenticatedUserProvider;

  public BoardMemberUseCaseHandler(
      BoardMemberRepositoryPort boardMemberRepository,
      BoardRepositoryPort boardRepository,
      UserRepositoryPort userRepository,
      AuthenticatedUserProvider authenticatedUserProvider) {
    this.boardMemberRepository = boardMemberRepository;
    this.boardRepository = boardRepository;
    this.userRepository = userRepository;
    this.authenticatedUserProvider = authenticatedUserProvider;
  }

  @Override
  @Transactional(readOnly = true)
  public List<BoardMemberResponse> listMembers(Long boardId) {
    User currentUser = authenticatedUserProvider.getAuthenticatedUser();
    Board board = getExistingBoard(boardId);
    assertIsBoardOwnerOrSuperAdmin(board, currentUser);

    return boardMemberRepository.findAllByBoardId(boardId).stream()
        .map(this::toResponse)
        .toList();
  }

  @Override
  @Transactional
  public BoardMemberResponse inviteMember(Long boardId, InviteBoardMemberCommand command) {
    User currentUser = authenticatedUserProvider.getAuthenticatedUser();
    Board board = getExistingBoard(boardId);
    assertIsBoardOwnerOrSuperAdmin(board, currentUser);

    User invitedUser = userRepository.findByEmail(command.email())
        .orElseThrow(() -> new ResourceNotFoundException("User with email '" + command.email() + "' not found"));

    if (invitedUser.getId().equals(currentUser.getId())) {
      throw new ConflictException("You cannot invite yourself to the board");
    }

    if (boardMemberRepository.findByBoardIdAndUserId(boardId, invitedUser.getId()).isPresent()) {
      throw new ConflictException("User is already a member of this board");
    }

    BoardMemberRole role = parseRole(command.role());

    BoardMember member = new BoardMember();
    member.setBoard(board);
    member.setUser(invitedUser);
    member.setRole(role);
    BoardMember saved = boardMemberRepository.save(member);

    return toResponse(saved);
  }

  @Override
  @Transactional
  public BoardMemberResponse updateMemberRole(Long boardId, Long memberId, UpdateBoardMemberRoleCommand command) {
    User currentUser = authenticatedUserProvider.getAuthenticatedUser();
    Board board = getExistingBoard(boardId);
    assertIsBoardOwnerOrSuperAdmin(board, currentUser);

    BoardMember member = boardMemberRepository.findById(memberId)
        .orElseThrow(() -> new ResourceNotFoundException("Board member not found"));

    if (!member.getBoard().getId().equals(boardId)) {
      throw new ResourceNotFoundException("Board member not found on this board");
    }

    member.setRole(parseRole(command.role()));
    BoardMember updated = boardMemberRepository.save(member);

    return toResponse(updated);
  }

  @Override
  @Transactional
  public void removeMember(Long boardId, Long memberId) {
    User currentUser = authenticatedUserProvider.getAuthenticatedUser();
    Board board = getExistingBoard(boardId);
    assertIsBoardOwnerOrSuperAdmin(board, currentUser);

    BoardMember member = boardMemberRepository.findById(memberId)
        .orElseThrow(() -> new ResourceNotFoundException("Board member not found"));

    if (!member.getBoard().getId().equals(boardId)) {
      throw new ResourceNotFoundException("Board member not found on this board");
    }

    boardMemberRepository.delete(member);
  }

  private Board getExistingBoard(Long id) {
    return boardRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Board not found"));
  }

  private void assertIsBoardOwnerOrSuperAdmin(Board board, User user) {
    if (!user.getRole().isSuperAdmin() && !board.getOwner().getId().equals(user.getId())) {
      throw new ForbiddenException("Only the board owner can manage members");
    }
  }

  private BoardMemberRole parseRole(String role) {
    try {
      return BoardMemberRole.valueOf(role.toUpperCase());
    } catch (IllegalArgumentException | NullPointerException e) {
      throw new ConflictException("Invalid role: '" + role + "'. Valid roles: INVITED, VIEW_ONLY, GUEST");
    }
  }

  private BoardMemberResponse toResponse(BoardMember member) {
    return new BoardMemberResponse(
        member.getId(),
        member.getBoard().getId(),
        member.getUser().getId(),
        member.getUser().getEmail(),
        member.getUser().getFullName(),
        member.getRole().name());
  }
}
