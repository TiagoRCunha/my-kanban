package com.tiagorcunha.mykanban.backend.board.infrastructure.web;

import com.tiagorcunha.mykanban.backend.board.application.command.UpdateBoardMemberRoleCommand;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(name = "UpdateBoardMemberRoleRequest", description = "Payload to update a board member's role")
public record UpdateBoardMemberRoleRequest(
    @Schema(description = "New role: INVITED, VIEW_ONLY, or GUEST", example = "VIEW_ONLY")
    @NotBlank String role) {

  public UpdateBoardMemberRoleCommand toCommand() {
    return new UpdateBoardMemberRoleCommand(role);
  }
}
