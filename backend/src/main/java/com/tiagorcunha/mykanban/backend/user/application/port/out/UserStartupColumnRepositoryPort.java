package com.tiagorcunha.mykanban.backend.user.application.port.out;

import java.util.List;

import com.tiagorcunha.mykanban.backend.user.domain.model.UserStartupColumn;

public interface UserStartupColumnRepositoryPort {

  List<UserStartupColumn> findByUserIdOrderByPositionAsc(Long userId);

  boolean existsByUserIdAndPosition(Long userId, Integer position);

  void deleteAllByUserId(Long userId);

  void saveAll(List<UserStartupColumn> columns);

  void flush();
}
