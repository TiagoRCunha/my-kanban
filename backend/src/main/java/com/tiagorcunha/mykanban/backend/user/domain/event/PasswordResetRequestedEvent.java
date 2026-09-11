package com.tiagorcunha.mykanban.backend.user.domain.event;

/**
 * Published when a password reset is requested for an existing account.
 * Carries the one-time reset token so listeners can build the reset link.
 */
public record PasswordResetRequestedEvent(
    Long userId,
    String email,
    String fullName,
    String resetToken) {
}
