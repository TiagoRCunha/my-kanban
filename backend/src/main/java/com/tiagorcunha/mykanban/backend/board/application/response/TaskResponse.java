package com.tiagorcunha.mykanban.backend.board.application.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import com.tiagorcunha.mykanban.backend.board.domain.model.TaskPriority;

import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "TaskResponse", description = "Task representation returned by the API")
public record TaskResponse(
    @Schema(example = "42")
    Long id,
    @Schema(example = "Implement login endpoint")
    String title,
    @Schema(example = "Add JWT-based authentication")
    String description,
    @Schema(example = "HIGH")
    TaskPriority priority,
    @Schema(example = "2026-08-15")
    LocalDate dueDate,
    @Schema(example = "6.50")
    BigDecimal estimatedHours,
    @Schema(example = "0")
    Integer position,
    @Schema(example = "21")
    Long columnId,
    @Schema(example = "1")
    Long reportedById,
    @ArraySchema(schema = @Schema(example = "2"))
    List<Long> assigneeIds,
    @Schema(example = "2026-07-05T10:30:00")
    LocalDateTime createdAt,
    @Schema(example = "2026-07-05T11:10:00")
    LocalDateTime updatedAt) {
}