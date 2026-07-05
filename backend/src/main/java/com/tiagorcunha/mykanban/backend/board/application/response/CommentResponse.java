package com.tiagorcunha.mykanban.backend.board.application.response;

import java.time.LocalDateTime;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "CommentResponse", description = "Comment representation returned by the API")
public record CommentResponse(
    @Schema(example = "100")
    Long id,
    @Schema(example = "Blocked by external API")
    String content,
    @Schema(example = "42")
    Long taskId,
    @Schema(example = "3")
    Long authorId,
    @Schema(example = "2026-07-05T10:40:00")
    LocalDateTime createdAt) {
}