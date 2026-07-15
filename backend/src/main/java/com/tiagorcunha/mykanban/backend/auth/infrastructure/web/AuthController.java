package com.tiagorcunha.mykanban.backend.auth.infrastructure.web;

import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tiagorcunha.mykanban.backend.auth.application.response.AuthTokenResponse;
import com.tiagorcunha.mykanban.backend.auth.application.usecase.AuthUseCaseHandler;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/auth")
@Validated
@Tag(name = "Auth", description = "Authentication endpoints")
public class AuthController {

  private final AuthUseCaseHandler authUseCaseHandler;

  public AuthController(AuthUseCaseHandler authUseCaseHandler) {
    this.authUseCaseHandler = authUseCaseHandler;
  }

  @PostMapping("/login")
  @Operation(summary = "Authenticate and receive a JWT access token")
  @ApiResponse(responseCode = "200", description = "Authenticated")
  @ApiResponse(responseCode = "401", description = "Invalid credentials")
  public AuthTokenResponse login(@Valid @RequestBody AuthLoginRequest request) {
    return authUseCaseHandler.authenticate(request.email(), request.password());
  }
}
