package com.tiagorcunha.mykanban.backend.board.application.command;

public record ReorderItemCommand(
    Long id,
    Integer position) {
}
