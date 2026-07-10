package com.tiagorcunha.mykanban.backend.user.application.port.in;

import com.tiagorcunha.mykanban.backend.user.application.response.UserResponse;

public interface FindUserByIdUseCase {

  UserResponse findById(Long id);
}