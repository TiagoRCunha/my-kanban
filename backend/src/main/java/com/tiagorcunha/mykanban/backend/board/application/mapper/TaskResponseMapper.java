package com.tiagorcunha.mykanban.backend.board.application.mapper;

import java.util.Comparator;

import com.tiagorcunha.mykanban.backend.board.application.response.TaskResponse;
import com.tiagorcunha.mykanban.backend.board.domain.model.Task;
import com.tiagorcunha.mykanban.backend.user.domain.model.UserCustomTag;

public final class TaskResponseMapper {

  private TaskResponseMapper() {
  }

  public static TaskResponse toResponse(Task task) {
    UserCustomTag tag = task.getTag();
    return new TaskResponse(
        task.getId(),
        task.getTitle(),
        task.getDescription(),
        tag != null ? tag.getId() : null,
        tag != null ? tag.getName() : null,
        tag != null ? tag.getColor() : null,
        task.getDueDate(),
        task.getEstimatedHours(),
        task.getPosition(),
        task.getDone(),
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