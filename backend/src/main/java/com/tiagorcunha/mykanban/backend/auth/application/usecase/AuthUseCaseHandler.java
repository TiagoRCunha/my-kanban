package com.tiagorcunha.mykanban.backend.auth.application.usecase;

import org.springframework.stereotype.Service;

import com.tiagorcunha.mykanban.backend.auth.application.response.AuthTokenResponse;
import com.tiagorcunha.mykanban.backend.common.application.exception.UnauthorizedException;
import com.tiagorcunha.mykanban.backend.common.infrastructure.security.JwtProperties;
import com.tiagorcunha.mykanban.backend.common.infrastructure.security.JwtTokenService;
import com.tiagorcunha.mykanban.backend.common.infrastructure.security.PasswordHashService;
import com.tiagorcunha.mykanban.backend.user.application.port.out.UserRepositoryPort;
import com.tiagorcunha.mykanban.backend.user.domain.model.User;

@Service
public class AuthUseCaseHandler {

  private final UserRepositoryPort userRepository;
  private final PasswordHashService passwordHashService;
  private final JwtTokenService jwtTokenService;
  private final JwtProperties jwtProperties;

  public AuthUseCaseHandler(
      UserRepositoryPort userRepository,
      PasswordHashService passwordHashService,
      JwtTokenService jwtTokenService,
      JwtProperties jwtProperties) {
    this.userRepository = userRepository;
    this.passwordHashService = passwordHashService;
    this.jwtTokenService = jwtTokenService;
    this.jwtProperties = jwtProperties;
  }

  public AuthTokenResponse authenticate(String email, String rawPassword) {
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new UnauthorizedException("Invalid credentials"));

    if (!passwordHashService.matches(rawPassword, user.getPasswordHash())) {
      throw new UnauthorizedException("Invalid credentials");
    }

    String token = jwtTokenService.generateToken(user);
    return new AuthTokenResponse(token, "Bearer", jwtProperties.getExpirationMinutes());
  }
}
