package com.tiagorcunha.mykanban.backend.board.application.mapper;

import com.tiagorcunha.mykanban.backend.board.application.response.BoardResponse;
import com.tiagorcunha.mykanban.backend.board.domain.model.Board;

public final class BoardResponseMapper {

  private BoardResponseMapper() {
  }

  public static BoardResponse toResponse(Board board) {
    return new BoardResponse(
        board.getId(),
        board.getTitle(),
        board.getDescription(),
        board.getOwner().getId(),
        board.getCreatedAt(),
        board.getUpdatedAt());
  }
}