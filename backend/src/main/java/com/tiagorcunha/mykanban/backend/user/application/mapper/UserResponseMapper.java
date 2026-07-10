package com.tiagorcunha.mykanban.backend.user.application.mapper;

import com.tiagorcunha.mykanban.backend.user.application.response.UserResponse;
import com.tiagorcunha.mykanban.backend.user.domain.model.User;

public final class UserResponseMapper {

  private UserResponseMapper() {
  }

  public static UserResponse toResponse(User user) {
    return new UserResponse(
        user.getId(),
        user.getFullName(),
        user.getEmail(),
        user.getAvatarUrl(),
        user.getCreatedAt(),
        user.getUpdatedAt());
  }
}