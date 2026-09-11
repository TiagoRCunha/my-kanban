package com.tiagorcunha.mykanban.backend.auth.infrastructure.web;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(name = "VerifyEmailRequest", description = "Payload with the one-time token from the activation link")
public record VerifyEmailRequest(
    @Schema(description = "Verification token from the email link", example = "eyJhbGciOiJIUzI1NiJ9...")
    @NotBlank String token) {
}
