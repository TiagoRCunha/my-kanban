package com.tiagorcunha.mykanban.backend.user.application.port.in;

import java.util.List;

import com.tiagorcunha.mykanban.backend.user.application.response.StartupColumnResponse;

public interface ListStartupColumnsUseCase {

  List<StartupColumnResponse> findStartupColumnsByUserId(Long userId);
}
