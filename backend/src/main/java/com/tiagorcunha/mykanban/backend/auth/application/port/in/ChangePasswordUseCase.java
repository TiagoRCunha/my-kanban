package com.tiagorcunha.mykanban.backend.auth.application.port.in;

import com.tiagorcunha.mykanban.backend.auth.application.command.ChangePasswordCommand;

/**
 * Changes the authenticated user's password after verifying the current one.
 */
public interface ChangePasswordUseCase {

  void changePassword(ChangePasswordCommand command);
}
