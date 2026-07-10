package com.tiagorcunha.mykanban.backend.board.application.port.out;

import java.util.List;
import java.util.Optional;

import com.tiagorcunha.mykanban.backend.board.domain.model.BoardColumn;

public interface BoardColumnRepositoryPort {

  List<BoardColumn> findByBoardId(Long boardId);

  Optional<BoardColumn> findById(Long id);

  boolean existsByBoardIdAndPosition(Long boardId, Integer position);

  boolean existsByBoardIdAndPositionAndIdNot(Long boardId, Integer position, Long id);

  BoardColumn save(BoardColumn boardColumn);

  void delete(BoardColumn boardColumn);
}