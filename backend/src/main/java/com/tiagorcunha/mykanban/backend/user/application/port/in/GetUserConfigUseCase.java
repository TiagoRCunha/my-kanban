package com.tiagorcunha.mykanban.backend.user.application.port.in;

import com.tiagorcunha.mykanban.backend.user.application.response.UserConfigResponse;

public interface GetUserConfigUseCase {

  UserConfigResponse findByUserId(Long userId);
}
