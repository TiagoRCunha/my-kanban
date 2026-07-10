package com.tiagorcunha.mykanban.backend.board.application.port.out;

import java.util.List;
import java.util.Optional;

import com.tiagorcunha.mykanban.backend.board.domain.model.Task;

public interface TaskRepositoryPort {

  List<Task> findByColumnId(Long columnId);

  Optional<Task> findById(Long id);

  boolean existsByColumnIdAndPosition(Long columnId, Integer position);

  boolean existsByColumnIdAndPositionAndIdNot(Long columnId, Integer position, Long id);

  Task save(Task task);

  void delete(Task task);
}