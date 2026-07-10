package com.tiagorcunha.mykanban.backend.board.application.command;

public record SaveCommentCommand(
    String content,
    Long authorId) {
}