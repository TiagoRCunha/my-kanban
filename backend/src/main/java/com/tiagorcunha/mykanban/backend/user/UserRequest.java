package com.tiagorcunha.mykanban.backend.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UserRequest(
    @NotBlank @Size(max = 100) String fullName,
    @NotBlank @Email @Size(max = 100) String email,
    @NotBlank @Size(max = 255) String passwordHash,
    @Size(max = 255) String avatarUrl) {
}
