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

import com.tiagorcunha.mykanban.backend.board.application.port.in.BoardMemberUseCase;
import com.tiagorcunha.mykanban.backend.board.application.response.BoardMemberResponse;
import com.tiagorcunha.mykanban.backend.common.infrastructure.web.ApiErrorResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/boards/{boardId}/members")
@Validated
@Tag(name = "Board Members", description = "Board sharing and member management endpoints")
public class BoardMemberController {

  private final BoardMemberUseCase boardMemberUseCase;

  public BoardMemberController(BoardMemberUseCase boardMemberUseCase) {
    this.boardMemberUseCase = boardMemberUseCase;
  }

  @GetMapping
  @Operation(summary = "List board members")
  @ApiResponses({
      @ApiResponse(responseCode = "200", description = "Members fetched"),
      @ApiResponse(
          responseCode = "403",
          description = "Only board owner can manage members",
          content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
      @ApiResponse(
          responseCode = "404",
          description = "Board not found",
          content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
  })
  public List<BoardMemberResponse> listMembers(@PathVariable Long boardId) {
    return boardMemberUseCase.listMembers(boardId);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  @Operation(summary = "Invite a user to the board by email")
  @ApiResponses({
      @ApiResponse(responseCode = "201", description = "Member invited"),
      @ApiResponse(
          responseCode = "400",
          description = "Invalid payload",
          content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
      @ApiResponse(
          responseCode = "403",
          description = "Only board owner can manage members",
          content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
      @ApiResponse(
          responseCode = "404",
          description = "Board or user not found",
          content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
      @ApiResponse(
          responseCode = "409",
          description = "User is already a member or trying to invite self",
          content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
  })
  public BoardMemberResponse inviteMember(
      @PathVariable Long boardId,
      @Valid @RequestBody InviteBoardMemberRequest request) {
    return boardMemberUseCase.inviteMember(boardId, request.toCommand());
  }

  @PutMapping("/{memberId}")
  @Operation(summary = "Update a board member's role")
  @ApiResponses({
      @ApiResponse(responseCode = "200", description = "Role updated"),
      @ApiResponse(
          responseCode = "400",
          description = "Invalid payload",
          content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
      @ApiResponse(
          responseCode = "403",
          description = "Only board owner can manage members",
          content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
      @ApiResponse(
          responseCode = "404",
          description = "Board or member not found",
          content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
  })
  public BoardMemberResponse updateMemberRole(
      @PathVariable Long boardId,
      @PathVariable Long memberId,
      @Valid @RequestBody UpdateBoardMemberRoleRequest request) {
    return boardMemberUseCase.updateMemberRole(boardId, memberId, request.toCommand());
  }

  @DeleteMapping("/{memberId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @Operation(summary = "Remove a member from the board")
  @ApiResponses({
      @ApiResponse(responseCode = "204", description = "Member removed"),
      @ApiResponse(
          responseCode = "403",
          description = "Only board owner can manage members",
          content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
      @ApiResponse(
          responseCode = "404",
          description = "Board or member not found",
          content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
  })
  public void removeMember(
      @PathVariable Long boardId,
      @PathVariable Long memberId) {
    boardMemberUseCase.removeMember(boardId, memberId);
  }
}
