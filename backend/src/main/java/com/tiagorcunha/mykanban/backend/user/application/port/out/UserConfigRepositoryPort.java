package com.tiagorcunha.mykanban.backend.user.application.port.out;

import java.util.Optional;

import com.tiagorcunha.mykanban.backend.user.domain.model.UserConfig;

public interface UserConfigRepositoryPort {

  Optional<UserConfig> findByUserId(Long userId);

  UserConfig save(UserConfig userConfig);
}
