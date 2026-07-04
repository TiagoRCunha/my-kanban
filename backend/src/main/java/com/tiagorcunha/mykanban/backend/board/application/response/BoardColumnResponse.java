package com.tiagorcunha.mykanban.backend.board.application.response;

import java.time.LocalDateTime;

public record BoardColumnResponse(
    Long id,
    String title,
    Integer position,
    Long boardId,
    LocalDateTime createdAt) {
}