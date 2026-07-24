package com.tiagorcunha.mykanban.backend.board.application.usecase;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tiagorcunha.mykanban.backend.board.application.command.SaveCommentCommand;
import com.tiagorcunha.mykanban.backend.board.application.mapper.CommentResponseMapper;
import com.tiagorcunha.mykanban.backend.board.application.port.in.CommentUseCase;
import com.tiagorcunha.mykanban.backend.board.application.port.out.CommentRepositoryPort;
import com.tiagorcunha.mykanban.backend.board.application.port.out.TaskRepositoryPort;
import com.tiagorcunha.mykanban.backend.board.application.response.CommentResponse;
import com.tiagorcunha.mykanban.backend.board.domain.model.Board;
import com.tiagorcunha.mykanban.backend.board.domain.model.Comment;
import com.tiagorcunha.mykanban.backend.board.domain.model.Task;
import com.tiagorcunha.mykanban.backend.common.application.exception.ResourceNotFoundException;
import com.tiagorcunha.mykanban.backend.common.infrastructure.security.AuthenticatedUserProvider;
import com.tiagorcunha.mykanban.backend.user.domain.model.User;

@Service
public class CommentUseCaseHandler implements CommentUseCase {

  private final CommentRepositoryPort commentRepository;
  private final TaskRepositoryPort taskRepository;
  private final AuthenticatedUserProvider authenticatedUserProvider;
  private final BoardAuthorizationService boardAuthorizationService;

  public CommentUseCaseHandler(
      CommentRepositoryPort commentRepository,
      TaskRepositoryPort taskRepository,
      AuthenticatedUserProvider authenticatedUserProvider,
      BoardAuthorizationService boardAuthorizationService) {
    this.commentRepository = commentRepository;
    this.taskRepository = taskRepository;
    this.authenticatedUserProvider = authenticatedUserProvider;
    this.boardAuthorizationService = boardAuthorizationService;
  }

  @Override
  @Transactional(readOnly = true)
  public List<CommentResponse> findByTaskId(Long taskId) {
    User currentUser = authenticatedUserProvider.getAuthenticatedUser();
    Task task = requireTask(taskId);
    boardAuthorizationService.assertCanReadBoard(task.getBoardColumn().getBoard(), currentUser);
    return commentRepository.findByTaskId(taskId).stream()
        .map(CommentResponseMapper::toResponse)
        .toList();
  }

  @Override
  @Transactional
  public CommentResponse create(Long taskId, SaveCommentCommand command) {
    User currentUser = authenticatedUserProvider.getAuthenticatedUser();
    Task task = requireTask(taskId);
    Board board = task.getBoardColumn().getBoard();
    boardAuthorizationService.assertCanCreateComment(board, currentUser);

    Comment comment = new Comment();
    comment.setContent(command.content());
    comment.setTask(task);
    comment.setAuthor(currentUser);
    comment.setCreatedAt(LocalDateTime.now());
    return CommentResponseMapper.toResponse(commentRepository.save(comment));
  }

  @Override
  @Transactional
  public CommentResponse update(Long taskId, Long commentId, SaveCommentCommand command) {
    User currentUser = authenticatedUserProvider.getAuthenticatedUser();
    Comment comment = getExistingComment(taskId, commentId);
    boardAuthorizationService.assertCanManageComment(comment, currentUser);
    comment.setContent(command.content());
    return CommentResponseMapper.toResponse(commentRepository.save(comment));
  }

  @Override
  @Transactional
  public void delete(Long taskId, Long commentId) {
    User currentUser = authenticatedUserProvider.getAuthenticatedUser();
    Comment comment = getExistingComment(taskId, commentId);
    boardAuthorizationService.assertCanManageComment(comment, currentUser);
    commentRepository.delete(comment);
  }

  private Task requireTask(Long taskId) {
    return taskRepository.findById(taskId)
        .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
  }

  private Comment getExistingComment(Long taskId, Long commentId) {
    Comment comment = commentRepository.findById(commentId)
        .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
    if (!comment.getTask().getId().equals(taskId)) {
      throw new ResourceNotFoundException("Comment not found");
    }
    return comment;
  }
}