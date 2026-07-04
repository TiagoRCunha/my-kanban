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

import jakarta.validation.Valid;

@RestController
@RequestMapping("/tasks/{taskId}/comments")
@Validated
public class CommentController {

  private final CommentUseCase commentUseCase;

  public CommentController(CommentUseCase commentUseCase) {
    this.commentUseCase = commentUseCase;
  }

  @GetMapping
  public List<CommentResponse> findByTaskId(@PathVariable Long taskId) {
    return commentUseCase.findByTaskId(taskId);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public CommentResponse create(@PathVariable Long taskId, @Valid @RequestBody CommentRequest request) {
    return commentUseCase.create(taskId, request.toCommand());
  }

  @PutMapping("/{commentId}")
  public CommentResponse update(
      @PathVariable Long taskId,
      @PathVariable Long commentId,
      @Valid @RequestBody CommentRequest request) {
    return commentUseCase.update(taskId, commentId, request.toCommand());
  }

  @DeleteMapping("/{commentId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable Long taskId, @PathVariable Long commentId) {
    commentUseCase.delete(taskId, commentId);
  }
}