package com.tiagorcunha.mykanban.backend.board.application.port.in;

import java.util.List;

import com.tiagorcunha.mykanban.backend.board.application.command.SaveBoardColumnCommand;
import com.tiagorcunha.mykanban.backend.board.application.response.BoardColumnResponse;

public interface BoardColumnUseCase {

  List<BoardColumnResponse> findByBoardId(Long boardId);

  BoardColumnResponse create(Long boardId, SaveBoardColumnCommand command);

  BoardColumnResponse update(Long boardId, Long columnId, SaveBoardColumnCommand command);

  void delete(Long boardId, Long columnId);
}