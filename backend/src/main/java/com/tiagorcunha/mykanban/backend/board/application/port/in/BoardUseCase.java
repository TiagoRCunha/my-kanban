package com.tiagorcunha.mykanban.backend.board.application.port.in;

import java.util.List;

import com.tiagorcunha.mykanban.backend.board.application.command.SaveBoardCommand;
import com.tiagorcunha.mykanban.backend.board.application.response.BoardResponse;

public interface BoardUseCase {

  List<BoardResponse> findAll();

  BoardResponse findById(Long id);

  BoardResponse create(SaveBoardCommand command);

  BoardResponse update(Long id, SaveBoardCommand command);

  void delete(Long id);
}