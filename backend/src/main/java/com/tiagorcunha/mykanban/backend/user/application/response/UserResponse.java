package com.tiagorcunha.mykanban.backend.user.application.response;

import java.time.LocalDateTime;

public record UserResponse(
    Long id,
    String fullName,
    String email,
    String avatarUrl,
    LocalDateTime createdAt,
    LocalDateTime updatedAt) {
}