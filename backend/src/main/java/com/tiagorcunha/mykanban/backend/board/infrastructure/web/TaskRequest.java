package com.tiagorcunha.mykanban.backend.board.infrastructure.web;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import com.tiagorcunha.mykanban.backend.board.application.command.SaveTaskCommand;
import com.tiagorcunha.mykanban.backend.board.domain.model.TaskPriority;

import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(name = "TaskRequest", description = "Payload to create or update a task")
public record TaskRequest(
  @Schema(description = "Task title", example = "Implement login endpoint")
    @NotBlank @Size(max = 150) String title,
  @Schema(description = "Task description", example = "Add JWT-based authentication")
    String description,
  @Schema(description = "Task priority", example = "HIGH")
    @jakarta.validation.constraints.NotNull TaskPriority priority,
  @Schema(description = "Task due date", example = "2026-08-15")
    LocalDate dueDate,
  @Schema(description = "Estimated effort in hours", example = "6.50")
    @DecimalMin(value = "0.0", inclusive = true) @Digits(integer = 3, fraction = 2) BigDecimal estimatedHours,
  @Schema(description = "Zero-based position inside the column", example = "0")
    @jakarta.validation.constraints.NotNull @Min(0) Integer position,
  @Schema(description = "Deprecated: ignored, reporter is always the authenticated user", example = "1")
    Long reportedById,
  @ArraySchema(schema = @Schema(description = "Assignee user id", example = "2"))
    List<Long> assigneeIds) {

  public SaveTaskCommand toCommand() {
    return new SaveTaskCommand(title, description, priority, dueDate, estimatedHours, position, reportedById, assigneeIds);
  }
}