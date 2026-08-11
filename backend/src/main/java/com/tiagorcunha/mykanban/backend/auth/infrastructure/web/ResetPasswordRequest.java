package com.tiagorcunha.mykanban.backend.auth.infrastructure.web;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(name = "ResetPasswordRequest", description = "Payload to set a new password from the reset link")
public record ResetPasswordRequest(
    @Schema(description = "One-time reset token from the email link", example = "eyJhbGciOiJIUzI1NiJ9...")
    @NotBlank String token,
    @Schema(description = "New raw password", example = "mypassword")
    @NotBlank @Size(min = 6, max = 255) String newPassword) {
}
