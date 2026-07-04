package com.tiagorcunha.mykanban.backend.user.application.port.out;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import com.tiagorcunha.mykanban.backend.user.domain.model.User;

public interface UserRepositoryPort {

  List<User> findAll();

  Optional<User> findById(Long id);

  Optional<User> findByEmail(String email);

  List<User> findAllById(Collection<Long> ids);

  boolean existsById(Long id);

  boolean existsByEmail(String email);

  User save(User user);

  void deleteById(Long id);
}