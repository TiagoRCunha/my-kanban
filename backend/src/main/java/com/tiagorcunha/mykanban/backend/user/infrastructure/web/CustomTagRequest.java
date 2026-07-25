package com.tiagorcunha.mykanban.backend.user.infrastructure.web;

import com.tiagorcunha.mykanban.backend.user.application.command.SaveCustomTagCommand;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@Schema(name = "CustomTagRequest", description = "Payload to create or update a custom tag")
public record CustomTagRequest(
    @Schema(description = "Tag name", example = "Critical")
    @NotBlank @Size(max = 50) String name,
    @Schema(description = "Hex color code", example = "#FF5733")
    @NotBlank @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Must be a valid hex color")
    @Size(max = 7) String color,
    @Schema(description = "Tag position (0-based)", example = "0")
    @NotNull Integer position) {

  public SaveCustomTagCommand toCommand() {
    return new SaveCustomTagCommand(name, color, position);
  }
}
