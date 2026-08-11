package com.tiagorcunha.mykanban.backend.user.domain.event;

/**
 * Published when a user's password has been successfully changed (via the
 * authenticated change-password flow or a password reset). Used to send a
 * confirmation email.
 */
public record PasswordChangedEvent(
    Long userId,
    String email,
    String fullName) {
}
