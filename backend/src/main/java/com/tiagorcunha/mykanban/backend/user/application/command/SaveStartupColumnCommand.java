package com.tiagorcunha.mykanban.backend.user.application.command;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "SaveStartupColumnCommand", description = "Command to define a startup column for new boards")
public record SaveStartupColumnCommand(
    @Schema(description = "Column title", example = "Backlog")
    String title,
    @Schema(description = "Column position (0-based)", example = "0")
    Integer position) {
}
