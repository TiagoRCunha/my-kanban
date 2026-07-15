package com.tiagorcunha.mykanban.backend.auth.infrastructure.web;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(name = "AuthLoginRequest", description = "Payload used to authenticate and receive a JWT token")
public record AuthLoginRequest(
    @Schema(description = "User email", example = "tiago@example.com")
    @NotBlank @Email @Size(max = 100) String email,
    @Schema(description = "Raw user password", example = "my-secret-password")
    @NotBlank @Size(max = 255) String password) {
}
