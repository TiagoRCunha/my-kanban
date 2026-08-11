package com.tiagorcunha.mykanban.backend.auth.infrastructure.web;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(name = "ResendVerificationRequest", description = "Payload to request a new activation email")
public record ResendVerificationRequest(
    @Schema(description = "Account email", example = "tiago@example.com")
    @NotBlank @Email @Size(max = 100) String email) {
}
