package com.tiagorcunha.mykanban.backend.user.application.port.in;

import com.tiagorcunha.mykanban.backend.user.application.command.SaveUserCommand;
import com.tiagorcunha.mykanban.backend.user.application.response.UserResponse;

public interface CreateUserUseCase {

  UserResponse create(SaveUserCommand command);
}