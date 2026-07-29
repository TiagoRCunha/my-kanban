package com.tiagorcunha.mykanban.backend.board.application.command;

import java.util.List;

public record MoveTaskCommand(
    Long targetColumnId,
    Integer position,
    List<ReorderItemCommand> reorderedSourceTasks,
    List<ReorderItemCommand> reorderedTargetTasks) {
}
