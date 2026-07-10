package com.tiagorcunha.mykanban.backend.board.infrastructure.persistence;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Component;

import com.tiagorcunha.mykanban.backend.board.application.port.out.TaskRepositoryPort;
import com.tiagorcunha.mykanban.backend.board.domain.model.Task;

@Component
public class TaskRepositoryAdapter implements TaskRepositoryPort {

  private final SpringDataTaskRepository repository;

  public TaskRepositoryAdapter(SpringDataTaskRepository repository) {
    this.repository = repository;
  }

  @Override
  public List<Task> findByColumnId(Long columnId) {
    return repository.findByBoardColumnIdOrderByPositionAsc(columnId);
  }

  @Override
  public Optional<Task> findById(Long id) {
    return repository.findById(id);
  }

  @Override
  public boolean existsByColumnIdAndPosition(Long columnId, Integer position) {
    return repository.existsByBoardColumnIdAndPosition(columnId, position);
  }

  @Override
  public boolean existsByColumnIdAndPositionAndIdNot(Long columnId, Integer position, Long id) {
    return repository.existsByBoardColumnIdAndPositionAndIdNot(columnId, position, id);
  }

  @Override
  public Task save(Task task) {
    return repository.save(task);
  }

  @Override
  public void delete(Task task) {
    repository.delete(task);
  }
}