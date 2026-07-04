package com.tiagorcunha.mykanban.backend.board.application.command;

public record SaveBoardCommand(
    String title,
    String description,
    Long ownerId) {
}