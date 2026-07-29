package com.tiagorcunha.mykanban.backend.user.infrastructure.persistence;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.tiagorcunha.mykanban.backend.user.domain.model.UserConfig;

public interface SpringDataUserConfigRepository extends JpaRepository<UserConfig, Long> {

  Optional<UserConfig> findByUserId(Long userId);
}
