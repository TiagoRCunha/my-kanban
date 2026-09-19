package com.tiagorcunha.mykanban.backend.board.application.command;

public record InviteBoardMemberCommand(
    String email,
    String role) {
}
