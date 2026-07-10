package com.tiagorcunha.mykanban.backend.board.application.response;

import java.time.LocalDateTime;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "BoardResponse", description = "Board representation returned by the API")
public record BoardResponse(
    @Schema(example = "10")
    Long id,
    @Schema(example = "Product Roadmap")
    String title,
    @Schema(example = "Q3 delivery and discovery")
    String description,
    @Schema(example = "1")
    Long ownerId,
    @Schema(example = "2026-07-05T10:21:33")
    LocalDateTime createdAt,
    @Schema(example = "2026-07-05T11:02:10")
    LocalDateTime updatedAt) {
}