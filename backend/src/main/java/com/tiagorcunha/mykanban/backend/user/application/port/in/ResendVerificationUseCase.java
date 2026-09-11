package com.tiagorcunha.mykanban.backend.user.application.port.in;

import com.tiagorcunha.mykanban.backend.user.application.command.ResendVerificationCommand;

/**
 * Sends a new verification email to an unverified account. Returns normally
 * even when the email is unknown or already verified, to avoid leaking which
 * accounts exist.
 */
public interface ResendVerificationUseCase {

  void resendVerification(ResendVerificationCommand command);
}
