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

import com.tiagorcunha.mykanban.backend.board.application.port.in.CommentUseCase;
import com.tiagorcunha.mykanban.backend.board.application.response.CommentResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/tasks/{taskId}/comments")
@Validated
@Tag(name = "Comments", description = "Task comment management endpoints")
public class CommentController {

  private final CommentUseCase commentUseCase;

  public CommentController(CommentUseCase commentUseCase) {
    this.commentUseCase = commentUseCase;
  }

  @GetMapping
    @Operation(summary = "List comments by task")
    @ApiResponses({
      @ApiResponse(responseCode = "200", description = "Comments fetched"),
      @ApiResponse(
        responseCode = "404",
        description = "Task not found",
        content = @Content(schema = @Schema(implementation = com.tiagorcunha.mykanban.backend.common.infrastructure.web.ApiErrorResponse.class)))
    })
  public List<CommentResponse> findByTaskId(@PathVariable Long taskId) {
    return commentUseCase.findByTaskId(taskId);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create comment in task")
    @ApiResponses({
      @ApiResponse(responseCode = "201", description = "Comment created"),
      @ApiResponse(
        responseCode = "400",
        description = "Invalid payload",
        content = @Content(schema = @Schema(implementation = com.tiagorcunha.mykanban.backend.common.infrastructure.web.ApiErrorResponse.class))),
      @ApiResponse(
        responseCode = "404",
        description = "Task or user not found",
        content = @Content(schema = @Schema(implementation = com.tiagorcunha.mykanban.backend.common.infrastructure.web.ApiErrorResponse.class)))
    })
  public CommentResponse create(@PathVariable Long taskId, @Valid @RequestBody CommentRequest request) {
    return commentUseCase.create(taskId, request.toCommand());
  }

  @PutMapping("/{commentId}")
    @Operation(summary = "Update comment")
    @ApiResponses({
      @ApiResponse(responseCode = "200", description = "Comment updated"),
      @ApiResponse(
        responseCode = "400",
        description = "Invalid payload",
        content = @Content(schema = @Schema(implementation = com.tiagorcunha.mykanban.backend.common.infrastructure.web.ApiErrorResponse.class))),
      @ApiResponse(
        responseCode = "404",
        description = "Comment, task, or user not found",
        content = @Content(schema = @Schema(implementation = com.tiagorcunha.mykanban.backend.common.infrastructure.web.ApiErrorResponse.class)))
    })
  public CommentResponse update(
      @PathVariable Long taskId,
      @PathVariable Long commentId,
      @Valid @RequestBody CommentRequest request) {
    return commentUseCase.update(taskId, commentId, request.toCommand());
  }

  @DeleteMapping("/{commentId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @Operation(summary = "Delete comment")
  @ApiResponses({
      @ApiResponse(responseCode = "204", description = "Comment deleted"),
      @ApiResponse(
          responseCode = "404",
          description = "Comment not found",
          content = @Content(schema = @Schema(implementation = com.tiagorcunha.mykanban.backend.common.infrastructure.web.ApiErrorResponse.class)))
  })
  public void delete(@PathVariable Long taskId, @PathVariable Long commentId) {
    commentUseCase.delete(taskId, commentId);
  }
}