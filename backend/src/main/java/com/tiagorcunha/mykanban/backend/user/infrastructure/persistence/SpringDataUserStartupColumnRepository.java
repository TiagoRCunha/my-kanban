package com.tiagorcunha.mykanban.backend.user.infrastructure.persistence;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.tiagorcunha.mykanban.backend.user.domain.model.UserStartupColumn;

public interface SpringDataUserStartupColumnRepository extends JpaRepository<UserStartupColumn, Long> {

  List<UserStartupColumn> findByUserIdOrderByPositionAsc(Long userId);

  boolean existsByUserIdAndPosition(Long userId, Integer position);

  void deleteAllByUserId(Long userId);
}
