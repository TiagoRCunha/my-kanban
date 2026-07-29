package com.tiagorcunha.mykanban.backend.board.infrastructure.web;

import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

@Schema(name = "ReorderRequest", description = "Payload to reorder columns or tasks within a container")
public record ReorderRequest(
    @Schema(description = "Ordered list of items with their new zero-based positions")
    @NotEmpty @Valid List<ReorderItem> items) {

  @Schema(name = "ReorderItem", description = "A single item with its new position")
  public record ReorderItem(
      @Schema(description = "Entity ID", example = "42")
      @NotNull Long id,
      @Schema(description = "New zero-based position", example = "0")
      @NotNull @Min(0) Integer position) {
  }
}
