package com.tiagorcunha.mykanban.backend.common.infrastructure.security;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class PasswordHashService {

  private final PasswordEncoder passwordEncoder;

  public PasswordHashService(PasswordEncoder passwordEncoder) {
    this.passwordEncoder = passwordEncoder;
  }

  public String encodeIfNeeded(String rawOrHashPassword) {
    if (isBcryptHash(rawOrHashPassword)) {
      return rawOrHashPassword;
    }
    return passwordEncoder.encode(rawOrHashPassword);
  }

  public boolean matches(String rawPassword, String storedHash) {
    if (storedHash == null || storedHash.isBlank()) {
      return false;
    }

    if (isBcryptHash(storedHash)) {
      return passwordEncoder.matches(rawPassword, storedHash);
    }

    return storedHash.equals(rawPassword);
  }

  private boolean isBcryptHash(String value) {
    return value != null
        && (value.startsWith("$2a$") || value.startsWith("$2b$") || value.startsWith("$2y$"));
  }
}
