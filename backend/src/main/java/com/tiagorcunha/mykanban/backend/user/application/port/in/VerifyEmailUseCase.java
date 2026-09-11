package com.tiagorcunha.mykanban.backend.user.application.port.in;

import com.tiagorcunha.mykanban.backend.user.application.command.VerifyEmailCommand;

/**
 * Activates a user account by validating the one-time email verification token
 * and marking the email as verified.
 */
public interface VerifyEmailUseCase {

  void verify(VerifyEmailCommand command);
}
