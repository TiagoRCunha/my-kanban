package com.tiagorcunha.mykanban.backend.user.infrastructure.persistence;

import java.util.Optional;

import org.springframework.stereotype.Component;

import com.tiagorcunha.mykanban.backend.user.application.port.out.UserConfigRepositoryPort;
import com.tiagorcunha.mykanban.backend.user.domain.model.UserConfig;

@Component
public class UserConfigRepositoryAdapter implements UserConfigRepositoryPort {

  private final SpringDataUserConfigRepository repository;

  public UserConfigRepositoryAdapter(SpringDataUserConfigRepository repository) {
    this.repository = repository;
  }

  @Override
  public Optional<UserConfig> findByUserId(Long userId) {
    return repository.findByUserId(userId);
  }

  @Override
  public UserConfig save(UserConfig userConfig) {
    return repository.save(userConfig);
  }
}
