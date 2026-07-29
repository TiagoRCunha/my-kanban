package com.tiagorcunha.mykanban.backend.user.application.port.in;

import com.tiagorcunha.mykanban.backend.user.application.command.SaveUserConfigCommand;
import com.tiagorcunha.mykanban.backend.user.application.response.UserConfigResponse;

public interface UpdateUserConfigUseCase {

  UserConfigResponse update(Long userId, SaveUserConfigCommand command);
}
