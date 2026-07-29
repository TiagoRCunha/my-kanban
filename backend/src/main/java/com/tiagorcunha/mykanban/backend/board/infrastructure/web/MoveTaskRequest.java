package com.tiagorcunha.mykanban.backend.board.infrastructure.web;

import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

@Schema(name = "MoveTaskRequest", description = "Payload to move a task to a different column with reordering of both source and target columns")
public record MoveTaskRequest(
    @Schema(description = "Target column ID to move the task into", example = "5")
    @NotNull Long targetColumnId,
    @Schema(description = "New zero-based position of the task in the target column", example = "2")
    @NotNull @Min(0) Integer position,
    @Schema(description = "Reordered tasks for the source column (after removing the moved task). Null if source === target.")
    List<ReorderRequest.ReorderItem> reorderedSourceTasks,
    @Schema(description = "Reordered tasks for the target column (including the moved task)")
    @NotNull @Valid List<ReorderRequest.ReorderItem> reorderedTargetTasks) {
}
