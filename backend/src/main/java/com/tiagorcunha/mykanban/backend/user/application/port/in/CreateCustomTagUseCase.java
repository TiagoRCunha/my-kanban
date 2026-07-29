package com.tiagorcunha.mykanban.backend.user.application.port.in;

import com.tiagorcunha.mykanban.backend.user.application.command.SaveCustomTagCommand;
import com.tiagorcunha.mykanban.backend.user.application.response.CustomTagResponse;

public interface CreateCustomTagUseCase {

  CustomTagResponse create(Long userId, SaveCustomTagCommand command);
}
