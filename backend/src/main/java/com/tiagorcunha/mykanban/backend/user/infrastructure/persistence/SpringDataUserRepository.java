package com.tiagorcunha.mykanban.backend.user.infrastructure.persistence;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.tiagorcunha.mykanban.backend.user.domain.model.User;

public interface SpringDataUserRepository extends JpaRepository<User, Long> {

  Optional<User> findByEmail(String email);

  boolean existsByEmail(String email);
}