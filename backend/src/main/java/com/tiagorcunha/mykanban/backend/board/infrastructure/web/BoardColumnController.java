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

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/boards/{boardId}/columns")
@Validated
@Tag(name = "Board Columns", description = "Board column management endpoints")
public class BoardColumnController {

  private final BoardColumnUseCase boardColumnUseCase;

  public BoardColumnController(BoardColumnUseCase boardColumnUseCase) {
    this.boardColumnUseCase = boardColumnUseCase;
  }

  @GetMapping
    @Operation(summary = "List columns by board")
    @ApiResponses({
      @ApiResponse(responseCode = "200", description = "Columns fetched"),
      @ApiResponse(
        responseCode = "404",
        description = "Board not found",
        content = @Content(schema = @Schema(implementation = com.tiagorcunha.mykanban.backend.common.infrastructure.web.ApiErrorResponse.class)))
    })
  public List<BoardColumnResponse> findByBoardId(@PathVariable Long boardId) {
    return boardColumnUseCase.findByBoardId(boardId);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create column in board")
    @ApiResponses({
      @ApiResponse(responseCode = "201", description = "Column created"),
      @ApiResponse(
        responseCode = "400",
        description = "Invalid payload",
        content = @Content(schema = @Schema(implementation = com.tiagorcunha.mykanban.backend.common.infrastructure.web.ApiErrorResponse.class))),
      @ApiResponse(
        responseCode = "404",
        description = "Board not found",
        content = @Content(schema = @Schema(implementation = com.tiagorcunha.mykanban.backend.common.infrastructure.web.ApiErrorResponse.class))),
      @ApiResponse(
        responseCode = "409",
        description = "Column position already in use",
        content = @Content(schema = @Schema(implementation = com.tiagorcunha.mykanban.backend.common.infrastructure.web.ApiErrorResponse.class)))
    })
  public BoardColumnResponse create(
      @PathVariable Long boardId,
      @Valid @RequestBody BoardColumnRequest request) {
    return boardColumnUseCase.create(boardId, request.toCommand());
  }

  @PutMapping("/{columnId}")
  @Operation(summary = "Update board column")
  @ApiResponses({
    @ApiResponse(responseCode = "200", description = "Column updated"),
    @ApiResponse(
      responseCode = "400",
      description = "Invalid payload",
      content = @Content(schema = @Schema(implementation = com.tiagorcunha.mykanban.backend.common.infrastructure.web.ApiErrorResponse.class))),
    @ApiResponse(
      responseCode = "404",
      description = "Board or column not found",
      content = @Content(schema = @Schema(implementation = com.tiagorcunha.mykanban.backend.common.infrastructure.web.ApiErrorResponse.class))),
    @ApiResponse(
      responseCode = "409",
      description = "Column position already in use",
      content = @Content(schema = @Schema(implementation = com.tiagorcunha.mykanban.backend.common.infrastructure.web.ApiErrorResponse.class)))
  })
  public BoardColumnResponse update(
      @PathVariable Long boardId,
      @PathVariable Long columnId,
      @Valid @RequestBody BoardColumnRequest request) {
    return boardColumnUseCase.update(boardId, columnId, request.toCommand());
  }

  @DeleteMapping("/{columnId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @Operation(summary = "Delete board column")
  @ApiResponses({
      @ApiResponse(responseCode = "204", description = "Column deleted"),
      @ApiResponse(
          responseCode = "404",
          description = "Board column not found",
          content = @Content(schema = @Schema(implementation = com.tiagorcunha.mykanban.backend.common.infrastructure.web.ApiErrorResponse.class)))
  })
  public void delete(@PathVariable Long boardId, @PathVariable Long columnId) {
    boardColumnUseCase.delete(boardId, columnId);
  }
}