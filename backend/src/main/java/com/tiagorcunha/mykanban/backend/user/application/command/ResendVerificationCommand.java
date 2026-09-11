package com.tiagorcunha.mykanban.backend.user.application.command;

/**
 * Command requesting a fresh verification email for an existing unverified
 * account.
 */
public record ResendVerificationCommand(String email) {
}
