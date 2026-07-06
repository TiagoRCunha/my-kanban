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
import com.tiagorcunha.mykanban.backend.common.infrastructure.web.ApiErrorResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/boards")
@Validated
@Tag(name = "Boards", description = "Board management endpoints")
public class BoardController {

  private final BoardUseCase boardUseCase;

  public BoardController(BoardUseCase boardUseCase) {
    this.boardUseCase = boardUseCase;
  }

  @GetMapping
  @Operation(summary = "List boards")
  @ApiResponse(responseCode = "200", description = "Boards fetched")
  public List<BoardResponse> findAll() {
    return boardUseCase.findAll();
  }

  @GetMapping("/{id}")
  @Operation(summary = "Get board by id")
  @ApiResponses({
      @ApiResponse(responseCode = "200", description = "Board found"),
      @ApiResponse(
          responseCode = "404",
          description = "Board not found",
          content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
  })
  public BoardResponse findById(@PathVariable Long id) {
    return boardUseCase.findById(id);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  @Operation(summary = "Create board")
  @ApiResponses({
      @ApiResponse(responseCode = "201", description = "Board created"),
      @ApiResponse(
          responseCode = "400",
          description = "Invalid payload",
          content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
      @ApiResponse(
          responseCode = "404",
          description = "Owner user not found",
          content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
  })
  public BoardResponse create(@Valid @RequestBody BoardRequest request) {
    return boardUseCase.create(request.toCommand());
  }

  @PutMapping("/{id}")
  @Operation(summary = "Update board")
  @ApiResponses({
      @ApiResponse(responseCode = "200", description = "Board updated"),
      @ApiResponse(
          responseCode = "400",
          description = "Invalid payload",
          content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
      @ApiResponse(
          responseCode = "404",
          description = "Board or owner user not found",
          content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
  })
  public BoardResponse update(@PathVariable Long id, @Valid @RequestBody BoardRequest request) {
    return boardUseCase.update(id, request.toCommand());
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @Operation(summary = "Delete board")
  @ApiResponses({
      @ApiResponse(responseCode = "204", description = "Board deleted"),
      @ApiResponse(
          responseCode = "404",
          description = "Board not found",
          content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
  })
  public void delete(@PathVariable Long id) {
    boardUseCase.delete(id);
  }
}