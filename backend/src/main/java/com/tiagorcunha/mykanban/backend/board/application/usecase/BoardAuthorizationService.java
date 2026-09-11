package com.tiagorcunha.mykanban.backend.board.application.usecase;

import org.springframework.stereotype.Service;

import com.tiagorcunha.mykanban.backend.board.application.port.out.BoardMemberRepositoryPort;
import com.tiagorcunha.mykanban.backend.board.domain.model.Board;
import com.tiagorcunha.mykanban.backend.board.domain.model.Comment;
import com.tiagorcunha.mykanban.backend.board.domain.model.Task;
import com.tiagorcunha.mykanban.backend.common.application.exception.ForbiddenException;
import com.tiagorcunha.mykanban.backend.user.domain.model.User;

@Service
public class BoardAuthorizationService {

  private final BoardMemberRepositoryPort boardMemberRepository;

  public BoardAuthorizationService(BoardMemberRepositoryPort boardMemberRepository) {
    this.boardMemberRepository = boardMemberRepository;
  }

  public boolean canReadBoard(Board board, User user) {
    return isSuperAdmin(user) || isBoardOwner(board, user) || isBoardMember(board, user);
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
    if (isSuperAdmin(user) || isBoardOwner(board, user) || isBoardMember(board, user)) {
      return;
    }
    throw new ForbiddenException("You do not have permission to create tasks");
  }

  public void assertCanManageTask(Task task, User user) {
    Board board = task.getBoardColumn().getBoard();
    if (isSuperAdmin(user) || isBoardOwner(board, user) || isTaskCreator(task, user)) {
      return;
    }
    throw new ForbiddenException("Only the task creator can delete this task");
  }

  public void assertCanCreateComment(Board board, User user) {
    if (isSuperAdmin(user) || isBoardOwner(board, user) || isBoardMember(board, user)) {
      return;
    }
    throw new ForbiddenException("You do not have permission to create comments");
  }

  public void assertCanManageComment(Comment comment, User user) {
    if (isSuperAdmin(user) || isCommentAuthor(comment, user)) {
      return;
    }
    throw new ForbiddenException("Only the comment author can edit or delete this comment");
  }

  private boolean isSuperAdmin(User user) {
    return user.getRole().isSuperAdmin();
  }

  private boolean isBoardOwner(Board board, User user) {
    return board.getOwner().getId().equals(user.getId());
  }

  private boolean isBoardMember(Board board, User user) {
    return boardMemberRepository.findByBoardIdAndUserId(board.getId(), user.getId()).isPresent();
  }

  private boolean isTaskCreator(Task task, User user) {
    return task.getReportedBy().getId().equals(user.getId());
  }

  private boolean isCommentAuthor(Comment comment, User user) {
    return comment.getAuthor().getId().equals(user.getId());
  }
}
