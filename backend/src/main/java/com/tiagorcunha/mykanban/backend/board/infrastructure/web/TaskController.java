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

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/columns/{columnId}/tasks")
@Validated
@Tag(name = "Tasks", description = "Task management endpoints")
public class TaskController {

  private final TaskUseCase taskUseCase;

  public TaskController(TaskUseCase taskUseCase) {
    this.taskUseCase = taskUseCase;
  }

  @GetMapping
    @Operation(summary = "List tasks by column")
    @ApiResponses({
      @ApiResponse(responseCode = "200", description = "Tasks fetched"),
      @ApiResponse(
        responseCode = "404",
        description = "Column not found",
        content = @Content(schema = @Schema(implementation = com.tiagorcunha.mykanban.backend.common.infrastructure.web.ApiErrorResponse.class)))
    })
  public List<TaskResponse> findByColumnId(@PathVariable Long columnId) {
    return taskUseCase.findByColumnId(columnId);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create task in column")
    @ApiResponses({
      @ApiResponse(responseCode = "201", description = "Task created"),
      @ApiResponse(
        responseCode = "400",
        description = "Invalid payload",
        content = @Content(schema = @Schema(implementation = com.tiagorcunha.mykanban.backend.common.infrastructure.web.ApiErrorResponse.class))),
      @ApiResponse(
        responseCode = "404",
        description = "Column or user not found",
        content = @Content(schema = @Schema(implementation = com.tiagorcunha.mykanban.backend.common.infrastructure.web.ApiErrorResponse.class))),
      @ApiResponse(
        responseCode = "409",
        description = "Task position already in use",
        content = @Content(schema = @Schema(implementation = com.tiagorcunha.mykanban.backend.common.infrastructure.web.ApiErrorResponse.class)))
    })
  public TaskResponse create(@PathVariable Long columnId, @Valid @RequestBody TaskRequest request) {
    return taskUseCase.create(columnId, request.toCommand());
  }

  @PutMapping("/{taskId}")
    @Operation(summary = "Update task")
    @ApiResponses({
      @ApiResponse(responseCode = "200", description = "Task updated"),
      @ApiResponse(
        responseCode = "400",
        description = "Invalid payload",
        content = @Content(schema = @Schema(implementation = com.tiagorcunha.mykanban.backend.common.infrastructure.web.ApiErrorResponse.class))),
      @ApiResponse(
        responseCode = "404",
        description = "Task, column, or user not found",
        content = @Content(schema = @Schema(implementation = com.tiagorcunha.mykanban.backend.common.infrastructure.web.ApiErrorResponse.class))),
      @ApiResponse(
        responseCode = "409",
        description = "Task position already in use",
        content = @Content(schema = @Schema(implementation = com.tiagorcunha.mykanban.backend.common.infrastructure.web.ApiErrorResponse.class)))
    })
  public TaskResponse update(
      @PathVariable Long columnId,
      @PathVariable Long taskId,
      @Valid @RequestBody TaskRequest request) {
    return taskUseCase.update(columnId, taskId, request.toCommand());
  }

  @DeleteMapping("/{taskId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @Operation(summary = "Delete task")
  @ApiResponses({
      @ApiResponse(responseCode = "204", description = "Task deleted"),
      @ApiResponse(
          responseCode = "404",
          description = "Task not found",
          content = @Content(schema = @Schema(implementation = com.tiagorcunha.mykanban.backend.common.infrastructure.web.ApiErrorResponse.class)))
  })
  public void delete(@PathVariable Long columnId, @PathVariable Long taskId) {
    taskUseCase.delete(columnId, taskId);
  }
}