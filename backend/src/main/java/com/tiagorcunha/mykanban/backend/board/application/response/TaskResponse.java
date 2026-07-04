package com.tiagorcunha.mykanban.backend.board.application.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import com.tiagorcunha.mykanban.backend.board.domain.model.TaskPriority;

public record TaskResponse(
    Long id,
    String title,
    String description,
    TaskPriority priority,
    LocalDate dueDate,
    BigDecimal estimatedHours,
    Integer position,
    Long columnId,
    Long reportedById,
    List<Long> assigneeIds,
    LocalDateTime createdAt,
    LocalDateTime updatedAt) {
}