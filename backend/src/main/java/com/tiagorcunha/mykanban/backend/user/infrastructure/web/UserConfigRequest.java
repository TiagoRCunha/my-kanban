package com.tiagorcunha.mykanban.backend.user.infrastructure.web;

import com.tiagorcunha.mykanban.backend.user.application.command.SaveUserConfigCommand;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "UserConfigRequest", description = "Payload to partially update user configuration")
public record UserConfigRequest(
    @Schema(description = "Whether dark mode is enabled", example = "true")
    Boolean darkMode,
    @Schema(description = "Default number of tasks shown per column", example = "10")
    Integer defaultTaskLimit) {

  public SaveUserConfigCommand toCommand() {
    return new SaveUserConfigCommand(darkMode, defaultTaskLimit);
  }
}
