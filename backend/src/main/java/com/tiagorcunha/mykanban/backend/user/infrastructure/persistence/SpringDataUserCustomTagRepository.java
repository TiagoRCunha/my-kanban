package com.tiagorcunha.mykanban.backend.user.infrastructure.persistence;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.tiagorcunha.mykanban.backend.user.domain.model.UserCustomTag;

public interface SpringDataUserCustomTagRepository extends JpaRepository<UserCustomTag, Long> {

  List<UserCustomTag> findByUserIdOrderByPositionAsc(Long userId);

  Optional<UserCustomTag> findByIdAndUserId(Long id, Long userId);

  boolean existsByUserIdAndPosition(Long userId, Integer position);

  boolean existsByUserIdAndPositionAndIdNot(Long userId, Integer position, Long id);
}
