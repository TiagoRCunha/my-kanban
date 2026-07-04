package com.tiagorcunha.mykanban.backend.board.infrastructure.web;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import com.tiagorcunha.mykanban.backend.board.application.command.SaveTaskCommand;
import com.tiagorcunha.mykanban.backend.board.domain.model.TaskPriority;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record TaskRequest(
    @NotBlank @Size(max = 150) String title,
    String description,
    @NotNull TaskPriority priority,
    LocalDate dueDate,
    @DecimalMin(value = "0.0", inclusive = true) @Digits(integer = 3, fraction = 2) BigDecimal estimatedHours,
    @NotNull @Min(0) Integer position,
    @NotNull Long reportedById,
    List<Long> assigneeIds) {

  public SaveTaskCommand toCommand() {
    return new SaveTaskCommand(title, description, priority, dueDate, estimatedHours, position, reportedById, assigneeIds);
  }
}