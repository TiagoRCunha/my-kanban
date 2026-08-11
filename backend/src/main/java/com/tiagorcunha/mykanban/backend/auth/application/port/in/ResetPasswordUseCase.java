package com.tiagorcunha.mykanban.backend.auth.application.port.in;

import com.tiagorcunha.mykanban.backend.auth.application.command.ResetPasswordCommand;

/**
 * Sets a new password after validating the one-time reset token from the email
 * link.
 */
public interface ResetPasswordUseCase {

  void resetPassword(ResetPasswordCommand command);
}
