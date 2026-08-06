package com.tiagorcunha.mykanban.backend.common.infrastructure.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * Fail-fast guard that prevents the application from starting with obvious weak
 * security configuration (placeholder JWT secret, default admin credentials).
 */
@Component
public class StartupSecretsGuard implements ApplicationRunner {

  static final String PLACEHOLDER_JWT_SECRET = "change-this-secret-key-for-production-please-123456";
  static final String PLACEHOLDER_ADMIN_PASSWORD = "mypassword";
  static final int MIN_JWT_SECRET_LENGTH = 32;
  static final int MIN_ADMIN_PASSWORD_LENGTH = 8;

  private final JwtProperties jwtProperties;

  @Value("${app.seed.admin.enabled:false}")
  private boolean seedAdminEnabled;

  @Value("${app.seed.admin.email:}")
  private String seedAdminEmail;

  @Value("${app.seed.admin.password:}")
  private String seedAdminPassword;

  public StartupSecretsGuard(JwtProperties jwtProperties) {
    this.jwtProperties = jwtProperties;
  }

  @Override
  public void run(ApplicationArguments args) {
    validateJwtSecret();
    if (seedAdminEnabled) {
      validateSeedAdminCredentials();
    }
  }

  private void validateJwtSecret() {
    String secret = jwtProperties.getSecret();
    if (secret == null || secret.isBlank()) {
      throw new IllegalStateException(
          "APP_JWT_SECRET is not configured. Refusing to start with an empty JWT signing secret.");
    }
    if (secret.length() < MIN_JWT_SECRET_LENGTH) {
      throw new IllegalStateException(
          "APP_JWT_SECRET must be at least " + MIN_JWT_SECRET_LENGTH + " characters long.");
    }
    if (PLACEHOLDER_JWT_SECRET.equals(secret)) {
      throw new IllegalStateException(
          "APP_JWT_SECRET is still set to the known placeholder value. Generate a strong random secret.");
    }
  }

  private void validateSeedAdminCredentials() {
    if (seedAdminEmail == null || seedAdminEmail.isBlank()) {
      throw new IllegalStateException(
          "APP_SEED_ADMIN_EMAIL must be set when startup admin seeding is enabled.");
    }
    if (seedAdminPassword == null || seedAdminPassword.length() < MIN_ADMIN_PASSWORD_LENGTH) {
      throw new IllegalStateException(
          "APP_SEED_ADMIN_PASSWORD must be at least " + MIN_ADMIN_PASSWORD_LENGTH + " characters long.");
    }
    if (PLACEHOLDER_ADMIN_PASSWORD.equals(seedAdminPassword)) {
      throw new IllegalStateException(
          "APP_SEED_ADMIN_PASSWORD is still set to the known placeholder value.");
    }
  }
}
