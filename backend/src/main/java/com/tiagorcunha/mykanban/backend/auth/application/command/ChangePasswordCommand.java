package com.tiagorcunha.mykanban.backend.auth.application.command;

/**
 * Payload for the authenticated change-password flow. The user is resolved
 * from the security context by the handler.
 */
public record ChangePasswordCommand(String currentPassword, String newPassword) {
}
