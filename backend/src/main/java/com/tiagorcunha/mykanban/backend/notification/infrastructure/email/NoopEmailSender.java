package com.tiagorcunha.mykanban.backend.notification.infrastructure.email;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.tiagorcunha.mykanban.backend.notification.application.dto.EmailMessage;
import com.tiagorcunha.mykanban.backend.notification.application.port.out.EmailSenderPort;

/**
 * Fallback adapter used when {@code app.mail.enabled=false}. Logs the message
 * instead of sending, so the application and tests never depend on an SMTP
 * server being reachable.
 */
public class NoopEmailSender implements EmailSenderPort {

  private static final Logger LOGGER = LoggerFactory.getLogger(NoopEmailSender.class);

  private final EmailProperties emailProperties;

  public NoopEmailSender(EmailProperties emailProperties) {
    this.emailProperties = emailProperties;
  }

  @Override
  public void send(EmailMessage message) {
    LOGGER.info(
        "[mail disabled] Would send '{}' to {} from {} via template '{}'",
        message.subject(),
        message.to(),
        emailProperties.getFrom(),
        message.templateName());
  }
}
