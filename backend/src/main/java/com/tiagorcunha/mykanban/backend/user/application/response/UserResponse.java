package com.tiagorcunha.mykanban.backend.user.application.response;

import java.time.LocalDateTime;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "UserResponse", description = "User representation returned by the API")
public record UserResponse(
    @Schema(example = "1")
    Long id,
    @Schema(example = "Tiago Cunha")
    String fullName,
    @Schema(example = "tiago@example.com")
    String email,
    @Schema(example = "https://cdn.example.com/avatars/tiago.png")
    String avatarUrl,
    @Schema(example = "2026-07-05T10:21:33")
    LocalDateTime createdAt,
    @Schema(example = "2026-07-05T11:02:10")
    LocalDateTime updatedAt) {
}