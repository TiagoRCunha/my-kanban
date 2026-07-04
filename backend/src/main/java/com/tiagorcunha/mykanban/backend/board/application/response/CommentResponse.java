package com.tiagorcunha.mykanban.backend.board.application.response;

import java.time.LocalDateTime;

public record CommentResponse(
    Long id,
    String content,
    Long taskId,
    Long authorId,
    LocalDateTime createdAt) {
}