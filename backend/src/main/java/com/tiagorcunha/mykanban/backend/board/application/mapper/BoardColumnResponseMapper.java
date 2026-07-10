package com.tiagorcunha.mykanban.backend.board.application.mapper;

import com.tiagorcunha.mykanban.backend.board.application.response.BoardColumnResponse;
import com.tiagorcunha.mykanban.backend.board.domain.model.BoardColumn;

public final class BoardColumnResponseMapper {

  private BoardColumnResponseMapper() {
  }

  public static BoardColumnResponse toResponse(BoardColumn boardColumn) {
    return new BoardColumnResponse(
        boardColumn.getId(),
        boardColumn.getTitle(),
        boardColumn.getPosition(),
        boardColumn.getBoard().getId(),
        boardColumn.getCreatedAt());
  }
}