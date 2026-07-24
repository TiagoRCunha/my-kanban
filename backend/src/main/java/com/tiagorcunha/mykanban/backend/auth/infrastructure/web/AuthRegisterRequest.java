package com.tiagorcunha.mykanban.backend.auth.infrastructure.web;

import com.tiagorcunha.mykanban.backend.user.application.command.SaveUserCommand;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(name = "AuthRegisterRequest", description = "Payload to register a normal user")
public record AuthRegisterRequest(
    @Schema(description = "Display name", example = "Tiago Cunha")
    @NotBlank @Size(max = 100) String fullName,
    @Schema(description = "Unique email", example = "tiago@example.com")
    @NotBlank @Email @Size(max = 100) String email,
    @Schema(description = "Raw password", example = "mypassword")
    @NotBlank @Size(min = 6, max = 255) String password,
    @Schema(description = "Avatar image URL", example = "https://cdn.example.com/avatars/tiago.png")
    @Size(max = 255) String avatarUrl) {

  public SaveUserCommand toCommand() {
    return new SaveUserCommand(fullName, email, password, avatarUrl);
  }
}
