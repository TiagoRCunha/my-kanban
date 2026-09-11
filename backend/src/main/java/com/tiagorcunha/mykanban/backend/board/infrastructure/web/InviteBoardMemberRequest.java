package com.tiagorcunha.mykanban.backend.board.infrastructure.web;

import com.tiagorcunha.mykanban.backend.board.application.command.InviteBoardMemberCommand;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Schema(name = "InviteBoardMemberRequest", description = "Payload to invite a user to a board by email")
public record InviteBoardMemberRequest(
    @Schema(description = "Email of the user to invite", example = "user@example.com")
    @NotBlank @Email String email,
    @Schema(description = "Role to assign: INVITED, VIEW_ONLY, or GUEST", example = "GUEST")
    @NotBlank String role) {

  public InviteBoardMemberCommand toCommand() {
    return new InviteBoardMemberCommand(email, role);
  }
}
