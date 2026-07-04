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

import com.tiagorcunha.mykanban.backend.board.application.port.in.BoardColumnUseCase;
import com.tiagorcunha.mykanban.backend.board.application.response.BoardColumnResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/boards/{boardId}/columns")
@Validated
public class BoardColumnController {

  private final BoardColumnUseCase boardColumnUseCase;

  public BoardColumnController(BoardColumnUseCase boardColumnUseCase) {
    this.boardColumnUseCase = boardColumnUseCase;
  }

  @GetMapping
  public List<BoardColumnResponse> findByBoardId(@PathVariable Long boardId) {
    return boardColumnUseCase.findByBoardId(boardId);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public BoardColumnResponse create(
      @PathVariable Long boardId,
      @Valid @RequestBody BoardColumnRequest request) {
    return boardColumnUseCase.create(boardId, request.toCommand());
  }

  @PutMapping("/{columnId}")
  public BoardColumnResponse update(
      @PathVariable Long boardId,
      @PathVariable Long columnId,
      @Valid @RequestBody BoardColumnRequest request) {
    return boardColumnUseCase.update(boardId, columnId, request.toCommand());
  }

  @DeleteMapping("/{columnId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable Long boardId, @PathVariable Long columnId) {
    boardColumnUseCase.delete(boardId, columnId);
  }
}