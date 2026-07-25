package com.tiagorcunha.mykanban.backend.user.application.command;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "SaveUserConfigCommand", description = "Command to update user configuration")
public record SaveUserConfigCommand(
    @Schema(description = "Whether dark mode is enabled", example = "true")
    Boolean darkMode) {
}
