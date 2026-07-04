package com.tiagorcunha.mykanban.backend.board.application.mapper;

import java.util.Comparator;

import com.tiagorcunha.mykanban.backend.board.application.response.TaskResponse;
import com.tiagorcunha.mykanban.backend.board.domain.model.Task;

public final class TaskResponseMapper {

  private TaskResponseMapper() {
  }

  public static TaskResponse toResponse(Task task) {
    return new TaskResponse(
        task.getId(),
        task.getTitle(),
        task.getDescription(),
        task.getPriority(),
        task.getDueDate(),
        task.getEstimatedHours(),
        task.getPosition(),
        task.getBoardColumn().getId(),
        task.getReportedBy().getId(),
        task.getAssignees().stream()
            .map(assignee -> assignee.getId())
            .sorted(Comparator.naturalOrder())
            .toList(),
        task.getCreatedAt(),
        task.getUpdatedAt());
  }
}