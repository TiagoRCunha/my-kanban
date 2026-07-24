package com.tiagorcunha.mykanban.backend.board.application.usecase;

import org.springframework.stereotype.Service;

import com.tiagorcunha.mykanban.backend.board.domain.model.Board;
import com.tiagorcunha.mykanban.backend.board.domain.model.Comment;
import com.tiagorcunha.mykanban.backend.board.domain.model.Task;
import com.tiagorcunha.mykanban.backend.common.application.exception.ForbiddenException;
import com.tiagorcunha.mykanban.backend.user.domain.model.User;

@Service
public class BoardAuthorizationService {

  public boolean canReadBoard(Board board, User user) {
    return isSuperAdmin(user) || isBoardOwner(board, user);
  }

  public void assertCanReadBoard(Board board, User user) {
    if (!canReadBoard(board, user)) {
      throw new ForbiddenException("You do not have permission to access this board");
    }
  }

  public void assertCanManageBoard(Board board, User user) {
    if (!isSuperAdmin(user) && !isBoardOwner(board, user)) {
      throw new ForbiddenException("Only board owner can manage this board");
    }
  }

  public void assertCanManageColumn(Board board, User user) {
    if (!isSuperAdmin(user) && !isBoardOwner(board, user)) {
      throw new ForbiddenException("Only board owner can manage board columns");
    }
  }

  public void assertCanCreateTask(Board board, User user) {
    if (isSuperAdmin(user) || isBoardOwner(board, user)) {
      return;
    }
    throw new ForbiddenException("You do not have permission to create tasks");
  }

  public void assertCanManageTask(Task task, User user) {
    Board board = task.getBoardColumn().getBoard();
    if (isSuperAdmin(user) || isBoardOwner(board, user)) {
      return;
    }
    throw new ForbiddenException("You do not have permission to manage this task");
  }

  public void assertCanCreateComment(Board board, User user) {
    if (isSuperAdmin(user) || isBoardOwner(board, user)) {
      return;
    }
    throw new ForbiddenException("You do not have permission to create comments");
  }

  public void assertCanManageComment(Comment comment, User user) {
    Board board = comment.getTask().getBoardColumn().getBoard();
    if (isSuperAdmin(user) || isBoardOwner(board, user)) {
      return;
    }
    throw new ForbiddenException("You do not have permission to manage this comment");
  }

  private boolean isSuperAdmin(User user) {
    return user.getRole().isSuperAdmin();
  }

  private boolean isBoardOwner(Board board, User user) {
    return board.getOwner().getId().equals(user.getId());
  }
}
