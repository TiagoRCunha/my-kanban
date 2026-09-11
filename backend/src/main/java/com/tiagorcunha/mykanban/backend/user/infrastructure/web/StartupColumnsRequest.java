package com.tiagorcunha.mykanban.backend.user.infrastructure.web;

import java.util.List;

import com.tiagorcunha.mykanban.backend.user.application.command.SaveStartupColumnCommand;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

@Schema(name = "StartupColumnsRequest", description = "Payload to replace all startup columns")
public record StartupColumnsRequest(
    @Schema(description = "List of startup columns") @NotEmpty @Valid
    List<StartupColumnItem> columns) {

  public List<SaveStartupColumnCommand> toCommands() {
    return columns.stream()
        .map(col -> new SaveStartupColumnCommand(col.title(), col.position(), col.type()))
        .toList();
  }

  @Schema(name = "StartupColumnItem", description = "A single startup column definition")
  public record StartupColumnItem(
      @Schema(description = "Column title", example = "Backlog")
      String title,
      @Schema(description = "Column position (0-based)", example = "0")
      Integer position,
      @Schema(description = "Column type: NORMAL, ARCHIVE, or DONE", example = "NORMAL")
      String type) {
  }
}
