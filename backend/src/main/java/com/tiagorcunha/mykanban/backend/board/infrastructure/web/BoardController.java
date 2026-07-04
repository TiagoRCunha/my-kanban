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

import com.tiagorcunha.mykanban.backend.board.application.port.in.BoardUseCase;
import com.tiagorcunha.mykanban.backend.board.application.response.BoardResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/boards")
@Validated
public class BoardController {

  private final BoardUseCase boardUseCase;

  public BoardController(BoardUseCase boardUseCase) {
    this.boardUseCase = boardUseCase;
  }

  @GetMapping
  public List<BoardResponse> findAll() {
    return boardUseCase.findAll();
  }

  @GetMapping("/{id}")
  public BoardResponse findById(@PathVariable Long id) {
    return boardUseCase.findById(id);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public BoardResponse create(@Valid @RequestBody BoardRequest request) {
    return boardUseCase.create(request.toCommand());
  }

  @PutMapping("/{id}")
  public BoardResponse update(@PathVariable Long id, @Valid @RequestBody BoardRequest request) {
    return boardUseCase.update(id, request.toCommand());
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable Long id) {
    boardUseCase.delete(id);
  }
}