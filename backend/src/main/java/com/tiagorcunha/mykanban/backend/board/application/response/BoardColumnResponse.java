package com.tiagorcunha.mykanban.backend.board.application.response;

import java.time.LocalDateTime;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "BoardColumnResponse", description = "Board column representation returned by the API")
public record BoardColumnResponse(
    @Schema(example = "21")
    Long id,
    @Schema(example = "In Progress")
    String title,
    @Schema(example = "1")
    Integer position,
    @Schema(example = "10")
    Long boardId,
    @Schema(example = "2026-07-05T10:25:00")
    LocalDateTime createdAt) {
}