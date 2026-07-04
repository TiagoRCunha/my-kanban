package com.tiagorcunha.mykanban.backend.board.infrastructure.web;

import com.tiagorcunha.mykanban.backend.board.application.command.SaveBoardColumnCommand;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record BoardColumnRequest(
    @NotBlank @Size(max = 50) String title,
    @NotNull @Min(0) Integer position) {

  public SaveBoardColumnCommand toCommand() {
    return new SaveBoardColumnCommand(title, position);
  }
}