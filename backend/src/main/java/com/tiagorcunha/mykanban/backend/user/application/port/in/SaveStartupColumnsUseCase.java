package com.tiagorcunha.mykanban.backend.user.application.port.in;

import java.util.List;

import com.tiagorcunha.mykanban.backend.user.application.command.SaveStartupColumnCommand;
import com.tiagorcunha.mykanban.backend.user.application.response.StartupColumnResponse;

public interface SaveStartupColumnsUseCase {

  List<StartupColumnResponse> saveAll(Long userId, List<SaveStartupColumnCommand> columns);
}
