package com.tiagorcunha.mykanban.backend.auth.application.command;

/**
 * Request to send a password reset link to an email address.
 */
public record ForgotPasswordCommand(String email) {
}
