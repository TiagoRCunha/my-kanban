package com.tiagorcunha.mykanban.backend.board.application.usecase;

import org.springframework.stereotype.Service;

import com.tiagorcunha.mykanban.backend.board.application.port.out.BoardMemberRepositoryPort;
import com.tiagorcunha.mykanban.backend.board.domain.model.Board;
import com.tiagorcunha.mykanban.backend.board.domain.model.BoardMemberRole;
import com.tiagorcunha.mykanban.backend.board.domain.model.Comment;
import com.tiagorcunha.mykanban.backend.board.domain.model.Task;
import com.tiagorcunha.mykanban.backend.common.application.exception.ForbiddenException;
import com.tiagorcunha.mykanban.backend.user.domain.model.User;
import com.tiagorcunha.mykanban.backend.user.domain.model.UserRole;

@Service
public class BoardAuthorizationService {

  private final BoardMemberRepositoryPort boardMemberRepository;

  public BoardAuthorizationService(BoardMemberRepositoryPort boardMemberRepository) {
    this.boardMemberRepository = boardMemberRepository;
  }

  public boolean canReadBoard(Board board, User user) {
    if (isAdmin(user) || isBoardOwner(board, user)) {
      return true;
    }
    return boardMemberRepository.findByBoardIdAndUserId(board.getId(), user.getId()).isPresent();
  }

  public void assertCanReadBoard(Board board, User user) {
    if (!canReadBoard(board, user)) {
      throw new ForbiddenException("You do not have permission to access this board");
    }
  }

  public void assertCanManageBoard(Board board, User user) {
    if (!isAdmin(user) && !isBoardOwner(board, user)) {
      throw new ForbiddenException("Only board owner can manage this board");
    }
  }

  public void assertCanManageColumn(Board board, User user) {
    if (!isAdmin(user) && !isBoardOwner(board, user)) {
      throw new ForbiddenException("Only board owner can manage board columns");
    }
  }

  public void assertCanCreateTask(Board board, User user) {
    if (isAdmin(user) || isBoardOwner(board, user) || isInvited(board, user)) {
      return;
    }
    throw new ForbiddenException("You do not have permission to create tasks");
  }

  public void assertCanManageTask(Task task, User user) {
    Board board = task.getBoardColumn().getBoard();
    if (isAdmin(user) || isBoardOwner(board, user) || isInvited(board, user) || isTaskOwner(task, user)) {
      return;
    }
    throw new ForbiddenException("You do not have permission to manage this task");
  }

  public void assertCanCreateComment(Board board, User user) {
    if (isAdmin(user) || isBoardOwner(board, user) || isInvited(board, user)) {
      return;
    }
    throw new ForbiddenException("You do not have permission to create comments");
  }

  public void assertCanManageComment(Comment comment, User user) {
    Board board = comment.getTask().getBoardColumn().getBoard();
    if (isAdmin(user) || isBoardOwner(board, user) || isInvited(board, user) || isCommentOwner(comment, user)) {
      return;
    }
    throw new ForbiddenException("You do not have permission to manage this comment");
  }

  private boolean isAdmin(User user) {
    return user.getRole() == UserRole.ADMIN;
  }

  private boolean isBoardOwner(Board board, User user) {
    return board.getOwner().getId().equals(user.getId());
  }

  private boolean isTaskOwner(Task task, User user) {
    return task.getReportedBy().getId().equals(user.getId());
  }

  private boolean isCommentOwner(Comment comment, User user) {
    return comment.getAuthor().getId().equals(user.getId());
  }

  private boolean isInvited(Board board, User user) {
    return boardMemberRepository.findByBoardIdAndUserId(board.getId(), user.getId())
        .map(member -> member.getRole() == BoardMemberRole.INVITED)
        .orElse(false);
  }
}
