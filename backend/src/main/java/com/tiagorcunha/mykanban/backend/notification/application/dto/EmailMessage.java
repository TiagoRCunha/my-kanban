package com.tiagorcunha.mykanban.backend.notification.application.dto;

import java.util.Map;

/**
 * Portable email message contract defined in the application layer.
 * The sender adapter resolves the HTML template by name and renders it with
 * the supplied variables, keeping the application layer free of mail/HTML concerns.
 */
public record EmailMessage(
    String to,
    String subject,
    String templateName,
    Map<String, Object> variables) {

  public EmailMessage {
    variables = Map.copyOf(variables);
  }
}
