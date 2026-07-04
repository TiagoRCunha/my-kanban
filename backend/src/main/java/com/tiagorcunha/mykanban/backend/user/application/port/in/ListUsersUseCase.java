package com.tiagorcunha.mykanban.backend.user.application.port.in;

import java.util.List;

import com.tiagorcunha.mykanban.backend.user.application.response.UserResponse;

public interface ListUsersUseCase {

  List<UserResponse> findAll();
}