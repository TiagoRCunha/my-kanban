package com.tiagorcunha.mykanban.backend.user.application.port.out;

import java.util.List;
import java.util.Optional;

import com.tiagorcunha.mykanban.backend.user.domain.model.UserCustomTag;

public interface UserCustomTagRepositoryPort {

  List<UserCustomTag> findByUserIdOrderByPositionAsc(Long userId);

  Optional<UserCustomTag> findByIdAndUserId(Long id, Long userId);

  boolean existsByUserIdAndPosition(Long userId, Integer position);

  boolean existsByUserIdAndPositionAndIdNot(Long userId, Integer position, Long id);

  UserCustomTag save(UserCustomTag tag);

  void delete(UserCustomTag tag);
}
