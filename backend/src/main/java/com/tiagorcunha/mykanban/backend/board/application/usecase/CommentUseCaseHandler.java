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
import com.tiagorcunha.mykanban.backend.board.domain.model.Comment;
import com.tiagorcunha.mykanban.backend.board.domain.model.Task;
import com.tiagorcunha.mykanban.backend.common.application.exception.ResourceNotFoundException;
import com.tiagorcunha.mykanban.backend.user.application.port.out.UserRepositoryPort;
import com.tiagorcunha.mykanban.backend.user.domain.model.User;

@Service
public class CommentUseCaseHandler implements CommentUseCase {

  private final CommentRepositoryPort commentRepository;
  private final TaskRepositoryPort taskRepository;
  private final UserRepositoryPort userRepository;

  public CommentUseCaseHandler(
      CommentRepositoryPort commentRepository,
      TaskRepositoryPort taskRepository,
      UserRepositoryPort userRepository) {
    this.commentRepository = commentRepository;
    this.taskRepository = taskRepository;
    this.userRepository = userRepository;
  }

  @Override
  @Transactional(readOnly = true)
  public List<CommentResponse> findByTaskId(Long taskId) {
    requireTask(taskId);
    return commentRepository.findByTaskId(taskId).stream()
        .map(CommentResponseMapper::toResponse)
        .toList();
  }

  @Override
  @Transactional
  public CommentResponse create(Long taskId, SaveCommentCommand command) {
    Comment comment = new Comment();
    comment.setContent(command.content());
    comment.setTask(requireTask(taskId));
    comment.setAuthor(getExistingUser(command.authorId()));
    comment.setCreatedAt(LocalDateTime.now());
    return CommentResponseMapper.toResponse(commentRepository.save(comment));
  }

  @Override
  @Transactional
  public CommentResponse update(Long taskId, Long commentId, SaveCommentCommand command) {
    Comment comment = getExistingComment(taskId, commentId);
    comment.setContent(command.content());
    comment.setAuthor(getExistingUser(command.authorId()));
    return CommentResponseMapper.toResponse(commentRepository.save(comment));
  }

  @Override
  @Transactional
  public void delete(Long taskId, Long commentId) {
    commentRepository.delete(getExistingComment(taskId, commentId));
  }

  private Task requireTask(Long taskId) {
    return taskRepository.findById(taskId)
        .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
  }

  private User getExistingUser(Long userId) {
    return userRepository.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("User not found"));
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