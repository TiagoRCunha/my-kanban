package com.tiagorcunha.mykanban.backend.board.application.mapper;

import com.tiagorcunha.mykanban.backend.board.application.response.CommentResponse;
import com.tiagorcunha.mykanban.backend.board.domain.model.Comment;

public final class CommentResponseMapper {

  private CommentResponseMapper() {
  }

  public static CommentResponse toResponse(Comment comment) {
    return new CommentResponse(
        comment.getId(),
        comment.getContent(),
        comment.getTask().getId(),
        comment.getAuthor().getId(),
        comment.getCreatedAt());
  }
}