package com.tiagorcunha.mykanban.backend.user.application.port.in;

public interface DeleteCustomTagUseCase {

  void delete(Long userId, Long tagId);
}
