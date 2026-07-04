package com.tiagorcunha.mykanban.backend.board.application.command;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import com.tiagorcunha.mykanban.backend.board.domain.model.TaskPriority;

public record SaveTaskCommand(
    String title,
    String description,
    TaskPriority priority,
    LocalDate dueDate,
    BigDecimal estimatedHours,
    Integer position,
    Long reportedById,
    List<Long> assigneeIds) {
}