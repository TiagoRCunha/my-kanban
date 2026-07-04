package com.tiagorcunha.mykanban.backend.board.application.response;

import java.time.LocalDateTime;

public record BoardResponse(
    Long id,
    String title,
    String description,
    Long ownerId,
    LocalDateTime createdAt,
    LocalDateTime updatedAt) {
}