package com.tiagorcunha.mykanban.backend.board.application.command;

public record SaveBoardColumnCommand(
    String title,
    Integer position) {
}