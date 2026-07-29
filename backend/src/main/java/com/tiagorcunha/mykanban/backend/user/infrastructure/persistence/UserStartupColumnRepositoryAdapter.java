package com.tiagorcunha.mykanban.backend.user.infrastructure.persistence;

import java.util.List;

import org.springframework.stereotype.Component;

import com.tiagorcunha.mykanban.backend.user.application.port.out.UserStartupColumnRepositoryPort;
import com.tiagorcunha.mykanban.backend.user.domain.model.UserStartupColumn;

@Component
public class UserStartupColumnRepositoryAdapter implements UserStartupColumnRepositoryPort {

  private final SpringDataUserStartupColumnRepository repository;

  public UserStartupColumnRepositoryAdapter(SpringDataUserStartupColumnRepository repository) {
    this.repository = repository;
  }

  @Override
  public List<UserStartupColumn> findByUserIdOrderByPositionAsc(Long userId) {
    return repository.findByUserIdOrderByPositionAsc(userId);
  }

  @Override
  public boolean existsByUserIdAndPosition(Long userId, Integer position) {
    return repository.existsByUserIdAndPosition(userId, position);
  }

  @Override
  public void deleteAllByUserId(Long userId) {
    repository.deleteAllByUserId(userId);
  }

  @Override
  public void saveAll(List<UserStartupColumn> columns) {
    repository.saveAll(columns);
  }
}
