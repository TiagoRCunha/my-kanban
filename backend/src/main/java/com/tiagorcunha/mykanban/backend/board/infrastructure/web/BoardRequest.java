package com.tiagorcunha.mykanban.backend.board.infrastructure.web;

import com.tiagorcunha.mykanban.backend.board.application.command.SaveBoardCommand;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record BoardRequest(
    @NotBlank @Size(max = 100) String title,
    String description,
    @NotNull Long ownerId) {

  public SaveBoardCommand toCommand() {
    return new SaveBoardCommand(title, description, ownerId);
  }
}