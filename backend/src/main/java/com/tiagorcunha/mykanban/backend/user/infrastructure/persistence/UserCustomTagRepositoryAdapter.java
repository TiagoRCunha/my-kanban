package com.tiagorcunha.mykanban.backend.user.infrastructure.persistence;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Component;

import com.tiagorcunha.mykanban.backend.user.application.port.out.UserCustomTagRepositoryPort;
import com.tiagorcunha.mykanban.backend.user.domain.model.UserCustomTag;

@Component
public class UserCustomTagRepositoryAdapter implements UserCustomTagRepositoryPort {

  private final SpringDataUserCustomTagRepository repository;

  public UserCustomTagRepositoryAdapter(SpringDataUserCustomTagRepository repository) {
    this.repository = repository;
  }

  @Override
  public List<UserCustomTag> findByUserIdOrderByPositionAsc(Long userId) {
    return repository.findByUserIdOrderByPositionAsc(userId);
  }

  @Override
  public Optional<UserCustomTag> findByIdAndUserId(Long id, Long userId) {
    return repository.findByIdAndUserId(id, userId);
  }

  @Override
  public boolean existsByUserIdAndPosition(Long userId, Integer position) {
    return repository.existsByUserIdAndPosition(userId, position);
  }

  @Override
  public boolean existsByUserIdAndPositionAndIdNot(Long userId, Integer position, Long id) {
    return repository.existsByUserIdAndPositionAndIdNot(userId, position, id);
  }

  @Override
  public UserCustomTag save(UserCustomTag tag) {
    return repository.save(tag);
  }

  @Override
  public List<UserCustomTag> saveAll(List<UserCustomTag> tags) {
    return repository.saveAll(tags);
  }

  @Override
  public void flush() {
    repository.flush();
  }

  @Override
  public void delete(UserCustomTag tag) {
    repository.delete(tag);
  }
}
