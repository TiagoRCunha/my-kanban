package com.tiagorcunha.mykanban.backend.notification.infrastructure.email;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Mail configuration bound to the "app.mail" prefix.
 * <p>
 * {@code enabled} gates which adapter is active: when false, a no-op sender is
 * used so tests/CI never contact an SMTP server.
 */
@ConfigurationProperties(prefix = "app.mail")
public class EmailProperties {

  private boolean enabled;
  private String from;

  public boolean isEnabled() {
    return enabled;
  }

  public void setEnabled(boolean enabled) {
    this.enabled = enabled;
  }

  public String getFrom() {
    return from;
  }

  public void setFrom(String from) {
    this.from = from;
  }
}
