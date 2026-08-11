package com.tiagorcunha.mykanban.backend.auth.application.command;

/**
 * Payload consumed when a user sets a new password through the link received
 * by email.
 */
public record ResetPasswordCommand(String token, String newPassword) {
}
