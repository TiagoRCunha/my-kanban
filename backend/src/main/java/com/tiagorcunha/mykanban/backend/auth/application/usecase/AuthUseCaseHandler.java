package com.tiagorcunha.mykanban.backend.auth.application.usecase;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.tiagorcunha.mykanban.backend.auth.application.response.AuthTokenResponse;
import com.tiagorcunha.mykanban.backend.common.application.exception.UnauthorizedException;
import com.tiagorcunha.mykanban.backend.common.infrastructure.security.JwtProperties;
import com.tiagorcunha.mykanban.backend.common.infrastructure.security.JwtTokenService;
import com.tiagorcunha.mykanban.backend.user.application.port.out.UserRepositoryPort;
import com.tiagorcunha.mykanban.backend.user.domain.model.User;

@Service
public class AuthUseCaseHandler {

  private final UserRepositoryPort userRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtTokenService jwtTokenService;
  private final JwtProperties jwtProperties;

  public AuthUseCaseHandler(
      UserRepositoryPort userRepository,
      PasswordEncoder passwordEncoder,
      JwtTokenService jwtTokenService,
      JwtProperties jwtProperties) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
    this.jwtTokenService = jwtTokenService;
    this.jwtProperties = jwtProperties;
  }

  public AuthTokenResponse authenticate(String email, String rawPassword) {
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new UnauthorizedException("Invalid credentials"));

    if (!isPasswordValid(rawPassword, user.getPasswordHash())) {
      throw new UnauthorizedException("Invalid credentials");
    }

    String token = jwtTokenService.generateToken(user.getEmail());
    return new AuthTokenResponse(token, "Bearer", jwtProperties.getExpirationMinutes());
  }

  private boolean isPasswordValid(String rawPassword, String storedHash) {
    if (storedHash == null || storedHash.isBlank()) {
      return false;
    }

    if (isBcryptHash(storedHash)) {
      return passwordEncoder.matches(rawPassword, storedHash);
    }

    return storedHash.equals(rawPassword);
  }

  private boolean isBcryptHash(String value) {
    return value.startsWith("$2a$") || value.startsWith("$2b$") || value.startsWith("$2y$");
  }
}
