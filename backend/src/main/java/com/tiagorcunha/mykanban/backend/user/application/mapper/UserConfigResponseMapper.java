package com.tiagorcunha.mykanban.backend.user.application.mapper;

import java.util.Collections;
import java.util.List;

import com.tiagorcunha.mykanban.backend.user.application.response.UserConfigResponse;
import com.tiagorcunha.mykanban.backend.user.domain.model.UserConfig;
import com.tiagorcunha.mykanban.backend.user.domain.model.UserCustomTag;
import com.tiagorcunha.mykanban.backend.user.domain.model.UserStartupColumn;

public final class UserConfigResponseMapper {

  private UserConfigResponseMapper() {
  }

  public static UserConfigResponse toResponse(
      UserConfig config,
      List<UserStartupColumn> startupColumns,
      List<UserCustomTag> customTags) {
    return new UserConfigResponse(
        config.getId(),
        config.getUser().getId(),
        config.getDarkMode(),
        startupColumns != null
            ? startupColumns.stream().map(StartupColumnResponseMapper::toResponse).toList()
            : Collections.emptyList(),
        customTags != null
            ? customTags.stream().map(CustomTagResponseMapper::toResponse).toList()
            : Collections.emptyList(),
        config.getCreatedAt(),
        config.getUpdatedAt());
  }
}
