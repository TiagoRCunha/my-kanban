package com.tiagorcunha.mykanban.backend.common.infrastructure.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * TTLs (in minutes) for the one-time purpose-scoped tokens.
 */
@ConfigurationProperties(prefix = "app.token")
public class TokenProperties {

  private long verificationTtlMinutes = 1440;
  private long resetTtlMinutes = 15;

  public long getVerificationTtlMinutes() {
    return verificationTtlMinutes;
  }

  public void setVerificationTtlMinutes(long verificationTtlMinutes) {
    this.verificationTtlMinutes = verificationTtlMinutes;
  }

  public long getResetTtlMinutes() {
    return resetTtlMinutes;
  }

  public void setResetTtlMinutes(long resetTtlMinutes) {
    this.resetTtlMinutes = resetTtlMinutes;
  }
}
