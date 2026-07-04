package com.tiagorcunha.mykanban.backend.user.application.command;

public record SaveUserCommand(
    String fullName,
    String email,
    String passwordHash,
    String avatarUrl) {
}