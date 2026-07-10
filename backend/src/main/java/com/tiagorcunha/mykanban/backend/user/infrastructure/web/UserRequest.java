package com.tiagorcunha.mykanban.backend.user.infrastructure.web;

import com.tiagorcunha.mykanban.backend.user.application.command.SaveUserCommand;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(name = "UserRequest", description = "Payload to create or update a user")
public record UserRequest(
  @Schema(description = "Display name", example = "Tiago Cunha")
    @NotBlank @Size(max = 100) String fullName,
  @Schema(description = "Unique email", example = "tiago@example.com")
    @NotBlank @Email @Size(max = 100) String email,
  @Schema(description = "Password hash", example = "$2a$10$...hash")
    @NotBlank @Size(max = 255) String passwordHash,
  @Schema(description = "Avatar image URL", example = "https://cdn.example.com/avatars/tiago.png")
    @Size(max = 255) String avatarUrl) {

  public SaveUserCommand toCommand() {
    return new SaveUserCommand(fullName, email, passwordHash, avatarUrl);
  }
}