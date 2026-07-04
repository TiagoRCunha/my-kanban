package com.tiagorcunha.mykanban.backend.board.infrastructure.web;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.tiagorcunha.mykanban.backend.board.application.port.in.TaskUseCase;
import com.tiagorcunha.mykanban.backend.board.application.response.TaskResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/columns/{columnId}/tasks")
@Validated
public class TaskController {

  private final TaskUseCase taskUseCase;

  public TaskController(TaskUseCase taskUseCase) {
    this.taskUseCase = taskUseCase;
  }

  @GetMapping
  public List<TaskResponse> findByColumnId(@PathVariable Long columnId) {
    return taskUseCase.findByColumnId(columnId);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public TaskResponse create(@PathVariable Long columnId, @Valid @RequestBody TaskRequest request) {
    return taskUseCase.create(columnId, request.toCommand());
  }

  @PutMapping("/{taskId}")
  public TaskResponse update(
      @PathVariable Long columnId,
      @PathVariable Long taskId,
      @Valid @RequestBody TaskRequest request) {
    return taskUseCase.update(columnId, taskId, request.toCommand());
  }

  @DeleteMapping("/{taskId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable Long columnId, @PathVariable Long taskId) {
    taskUseCase.delete(columnId, taskId);
  }
}