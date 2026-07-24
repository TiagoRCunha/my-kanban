package com.tiagorcunha.mykanban.backend.board.infrastructure.web;

import com.tiagorcunha.mykanban.backend.board.application.command.SaveBoardCommand;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(name = "BoardRequest", description = "Payload to create or update a board")
public record BoardRequest(
  @Schema(description = "Board title", example = "Product Roadmap")
    @NotBlank @Size(max = 100) String title,
  @Schema(description = "Board description", example = "Q3 delivery and discovery")
    String description,
  @Schema(description = "Deprecated: ignored, owner is always the authenticated user", example = "1")
    Long ownerId) {

  public SaveBoardCommand toCommand() {
    return new SaveBoardCommand(title, description, ownerId);
  }
}