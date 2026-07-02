package com.tiagorcunha.mykanban.backend.user;

import java.time.LocalDateTime;

public record UserResponse(
    Long id,
    String fullName,
    String email,
    String avatarUrl,
    LocalDateTime createdAt,
    LocalDateTime updatedAt) {

  public static UserResponse fromEntity(User user) {
    return new UserResponse(
        user.getId(),
        user.getFullName(),
        user.getEmail(),
        user.getAvatarUrl(),
        user.getCreatedAt(),
        user.getUpdatedAt());
  }
}
