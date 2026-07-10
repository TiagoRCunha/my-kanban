package com.tiagorcunha.mykanban.backend.board.infrastructure.persistence;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.tiagorcunha.mykanban.backend.board.domain.model.Task;

public interface SpringDataTaskRepository extends JpaRepository<Task, Long> {

  List<Task> findByBoardColumnIdOrderByPositionAsc(Long columnId);

  boolean existsByBoardColumnIdAndPosition(Long columnId, Integer position);

  boolean existsByBoardColumnIdAndPositionAndIdNot(Long columnId, Integer position, Long id);
}