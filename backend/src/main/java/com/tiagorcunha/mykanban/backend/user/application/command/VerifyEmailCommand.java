package com.tiagorcunha.mykanban.backend.user.application.command;

/**
 * Command carrying the one-time verification token received through the
 * activation link sent by email.
 */
public record VerifyEmailCommand(String token) {
}
