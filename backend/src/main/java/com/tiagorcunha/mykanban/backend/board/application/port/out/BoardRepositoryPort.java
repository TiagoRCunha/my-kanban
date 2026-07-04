package com.tiagorcunha.mykanban.backend.board.application.port.out;

import java.util.List;
import java.util.Optional;

import com.tiagorcunha.mykanban.backend.board.domain.model.Board;

public interface BoardRepositoryPort {

  List<Board> findAll();

  Optional<Board> findById(Long id);

  boolean existsById(Long id);

  Board save(Board board);

  void deleteById(Long id);
}