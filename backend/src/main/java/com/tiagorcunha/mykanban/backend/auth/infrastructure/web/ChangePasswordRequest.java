package com.tiagorcunha.mykanban.backend.auth.infrastructure.web;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(name = "ChangePasswordRequest", description = "Payload to change the authenticated user's password")
public record ChangePasswordRequest(
    @Schema(description = "Current raw password", example = "old-password")
    @NotBlank @Size(max = 255) String currentPassword,
    @Schema(description = "New raw password", example = "new-password")
    @NotBlank @Size(min = 6, max = 255) String newPassword) {
}
