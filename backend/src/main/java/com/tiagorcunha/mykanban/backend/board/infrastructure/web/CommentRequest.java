package com.tiagorcunha.mykanban.backend.board.infrastructure.web;

import com.tiagorcunha.mykanban.backend.board.application.command.SaveCommentCommand;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CommentRequest(
    @NotBlank String content,
    @NotNull Long authorId) {

  public SaveCommentCommand toCommand() {
    return new SaveCommentCommand(content, authorId);
  }
}