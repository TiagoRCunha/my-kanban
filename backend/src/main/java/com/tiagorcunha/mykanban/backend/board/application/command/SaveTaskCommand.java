package com.tiagorcunha.mykanban.backend.board.application.command;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record SaveTaskCommand(
    String title,
    String description,
    Long tagId,
    LocalDate dueDate,
    BigDecimal estimatedHours,
    Integer position,
    Long reportedById,
    List<Long> assigneeIds) {
}