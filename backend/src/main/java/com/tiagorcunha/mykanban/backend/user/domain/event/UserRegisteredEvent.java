package com.tiagorcunha.mykanban.backend.user.domain.event;

/**
 * Published when a new user account is created through self-registration.
 * Carries the one-time verification token so listeners can build the
 * activation link without coupling to token infrastructure.
 */
public record UserRegisteredEvent(
    Long userId,
    String email,
    String fullName,
    String verificationToken) {
}
