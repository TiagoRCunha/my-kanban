package com.tiagorcunha.mykanban.backend.user.application.command;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "SaveCustomTagCommand", description = "Command to create or update a custom tag")
public record SaveCustomTagCommand(
    @Schema(description = "Tag name", example = "Critical")
    String name,
    @Schema(description = "Hex color code", example = "#FF5733")
    String color,
    @Schema(description = "Tag position (0-based)", example = "0")
    Integer position) {
}
