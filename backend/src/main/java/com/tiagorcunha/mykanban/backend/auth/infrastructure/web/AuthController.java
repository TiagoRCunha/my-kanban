package com.tiagorcunha.mykanban.backend.auth.infrastructure.web;

import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tiagorcunha.mykanban.backend.auth.application.response.AuthTokenResponse;
import com.tiagorcunha.mykanban.backend.auth.application.usecase.AuthUseCaseHandler;
import com.tiagorcunha.mykanban.backend.user.application.port.in.CreateUserUseCase;
import com.tiagorcunha.mykanban.backend.user.application.response.UserResponse;

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
  private final CreateUserUseCase createUserUseCase;

  public AuthController(AuthUseCaseHandler authUseCaseHandler, CreateUserUseCase createUserUseCase) {
    this.authUseCaseHandler = authUseCaseHandler;
    this.createUserUseCase = createUserUseCase;
  }

  @PostMapping("/login")
  @Operation(summary = "Authenticate and receive a JWT access token")
  @ApiResponse(responseCode = "200", description = "Authenticated")
  @ApiResponse(responseCode = "401", description = "Invalid credentials")
  public AuthTokenResponse login(@Valid @RequestBody AuthLoginRequest request) {
    return authUseCaseHandler.authenticate(request.email(), request.password());
  }

  @PostMapping("/register")
  @Operation(summary = "Register a new user")
  @ApiResponse(responseCode = "200", description = "Registered")
  @ApiResponse(responseCode = "409", description = "Email already in use")
  public UserResponse register(@Valid @RequestBody AuthRegisterRequest request) {
    return createUserUseCase.create(request.toCommand());
  }
}
