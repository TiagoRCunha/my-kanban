package com.tiagorcunha.mykanban.backend.board.infrastructure.web;

import com.tiagorcunha.mykanban.backend.board.application.command.SaveBoardColumnCommand;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Schema(name = "BoardColumnRequest", description = "Payload to create or update a board column")
public record BoardColumnRequest(
  @Schema(description = "Column title", example = "In Progress")
    @NotBlank @Size(max = 50) String title,
  @Schema(description = "Zero-based column position", example = "1")
    @NotNull @Min(0) Integer position) {

  public SaveBoardColumnCommand toCommand() {
    return new SaveBoardColumnCommand(title, position);
  }
}