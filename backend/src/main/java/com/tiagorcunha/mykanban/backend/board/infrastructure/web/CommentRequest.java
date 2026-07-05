package com.tiagorcunha.mykanban.backend.board.infrastructure.web;

import com.tiagorcunha.mykanban.backend.board.application.command.SaveCommentCommand;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Schema(name = "CommentRequest", description = "Payload to create or update a task comment")
public record CommentRequest(
  @Schema(description = "Comment text", example = "Blocked by external API")
    @NotBlank String content,
  @Schema(description = "Comment author user id", example = "3")
    @NotNull Long authorId) {

  public SaveCommentCommand toCommand() {
    return new SaveCommentCommand(content, authorId);
  }
}