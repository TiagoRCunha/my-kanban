package com.tiagorcunha.mykanban.backend.board.infrastructure.persistence;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.tiagorcunha.mykanban.backend.board.domain.model.BoardColumn;

public interface SpringDataBoardColumnRepository extends JpaRepository<BoardColumn, Long> {

  List<BoardColumn> findByBoardIdOrderByPositionAsc(Long boardId);

  boolean existsByBoardIdAndPosition(Long boardId, Integer position);

  boolean existsByBoardIdAndPositionAndIdNot(Long boardId, Integer position, Long id);
}