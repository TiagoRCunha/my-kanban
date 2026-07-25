package com.tiagorcunha.mykanban.backend.user.application.mapper;

import com.tiagorcunha.mykanban.backend.user.application.response.StartupColumnResponse;
import com.tiagorcunha.mykanban.backend.user.domain.model.UserStartupColumn;

public final class StartupColumnResponseMapper {

  private StartupColumnResponseMapper() {
  }

  public static StartupColumnResponse toResponse(UserStartupColumn column) {
    return new StartupColumnResponse(
        column.getId(),
        column.getTitle(),
        column.getPosition());
  }
}
