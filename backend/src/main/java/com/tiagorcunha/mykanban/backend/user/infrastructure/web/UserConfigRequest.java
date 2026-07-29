package com.tiagorcunha.mykanban.backend.user.infrastructure.web;

import com.tiagorcunha.mykanban.backend.user.application.command.SaveUserConfigCommand;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

@Schema(name = "UserConfigRequest", description = "Payload to update user configuration")
public record UserConfigRequest(
    @Schema(description = "Whether dark mode is enabled", example = "true")
    @NotNull Boolean darkMode) {

  public SaveUserConfigCommand toCommand() {
    return new SaveUserConfigCommand(darkMode);
  }
}
