package com.tiagorcunha.mykanban.backend.user.application.mapper;

import com.tiagorcunha.mykanban.backend.user.application.response.CustomTagResponse;
import com.tiagorcunha.mykanban.backend.user.domain.model.UserCustomTag;

public final class CustomTagResponseMapper {

  private CustomTagResponseMapper() {
  }

  public static CustomTagResponse toResponse(UserCustomTag tag) {
    return new CustomTagResponse(
        tag.getId(),
        tag.getName(),
        tag.getColor(),
        tag.getPosition());
  }
}
