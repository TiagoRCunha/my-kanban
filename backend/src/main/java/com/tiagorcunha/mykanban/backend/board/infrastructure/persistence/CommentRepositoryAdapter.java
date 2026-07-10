package com.tiagorcunha.mykanban.backend.board.infrastructure.persistence;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Component;

import com.tiagorcunha.mykanban.backend.board.application.port.out.CommentRepositoryPort;
import com.tiagorcunha.mykanban.backend.board.domain.model.Comment;

@Component
public class CommentRepositoryAdapter implements CommentRepositoryPort {

  private final SpringDataCommentRepository repository;

  public CommentRepositoryAdapter(SpringDataCommentRepository repository) {
    this.repository = repository;
  }

  @Override
  public List<Comment> findByTaskId(Long taskId) {
    return repository.findByTaskIdOrderByCreatedAtAsc(taskId);
  }

  @Override
  public Optional<Comment> findById(Long id) {
    return repository.findById(id);
  }

  @Override
  public Comment save(Comment comment) {
    return repository.save(comment);
  }

  @Override
  public void delete(Comment comment) {
    repository.delete(comment);
  }
}