package com.tiagorcunha.mykanban.backend.auth.application.port.in;

import com.tiagorcunha.mykanban.backend.auth.application.command.ForgotPasswordCommand;

/**
 * Sends a password reset email for an existing account. The use case must not
 * reveal whether the email is registered.
 */
public interface ForgotPasswordUseCase {

  void requestPasswordReset(ForgotPasswordCommand command);
}
