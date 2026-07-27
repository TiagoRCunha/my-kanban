package com.tiagorcunha.mykanban.backend.board.application.port.in;

import java.util.List;

import com.tiagorcunha.mykanban.backend.board.application.command.MoveTaskCommand;
import com.tiagorcunha.mykanban.backend.board.application.command.ReorderItemCommand;
import com.tiagorcunha.mykanban.backend.board.application.command.SaveTaskCommand;
import com.tiagorcunha.mykanban.backend.board.application.response.TaskResponse;

public interface TaskUseCase {

  List<TaskResponse> findByColumnId(Long columnId);

  TaskResponse create(Long columnId, SaveTaskCommand command);

  TaskResponse update(Long columnId, Long taskId, SaveTaskCommand command);

  void delete(Long columnId, Long taskId);

  void reorder(Long columnId, List<ReorderItemCommand> items);

  void move(Long taskId, MoveTaskCommand command);
}