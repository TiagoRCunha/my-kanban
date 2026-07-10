package com.tiagorcunha.mykanban.backend.board.application.port.out;

import java.util.List;
import java.util.Optional;

import com.tiagorcunha.mykanban.backend.board.domain.model.Comment;

public interface CommentRepositoryPort {

  List<Comment> findByTaskId(Long taskId);

  Optional<Comment> findById(Long id);

  Comment save(Comment comment);

  void delete(Comment comment);
}