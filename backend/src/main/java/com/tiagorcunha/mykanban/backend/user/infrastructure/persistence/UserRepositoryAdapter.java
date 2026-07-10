package com.tiagorcunha.mykanban.backend.user.infrastructure.persistence;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Component;

import com.tiagorcunha.mykanban.backend.user.application.port.out.UserRepositoryPort;
import com.tiagorcunha.mykanban.backend.user.domain.model.User;

@Component
public class UserRepositoryAdapter implements UserRepositoryPort {

  private final SpringDataUserRepository repository;

  public UserRepositoryAdapter(SpringDataUserRepository repository) {
    this.repository = repository;
  }

  @Override
  public List<User> findAll() {
    return repository.findAll();
  }

  @Override
  public Optional<User> findById(Long id) {
    return repository.findById(id);
  }

  @Override
  public Optional<User> findByEmail(String email) {
    return repository.findByEmail(email);
  }

  @Override
  public List<User> findAllById(Collection<Long> ids) {
    return repository.findAllById(ids);
  }

  @Override
  public boolean existsById(Long id) {
    return repository.existsById(id);
  }

  @Override
  public boolean existsByEmail(String email) {
    return repository.existsByEmail(email);
  }

  @Override
  public User save(User user) {
    return repository.save(user);
  }

  @Override
  public void deleteById(Long id) {
    repository.deleteById(id);
  }
}