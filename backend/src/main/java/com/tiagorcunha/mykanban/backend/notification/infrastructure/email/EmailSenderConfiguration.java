package com.tiagorcunha.mykanban.backend.notification.infrastructure.email;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.thymeleaf.TemplateEngine;

import com.tiagorcunha.mykanban.backend.notification.application.port.out.EmailSenderPort;

/**
 * Wires the email adapter beans. The SMTP sender is only active when
 * {@code app.mail.enabled=true}; otherwise a no-op sender is used.
 */
@Configuration
@EnableConfigurationProperties(EmailProperties.class)
public class EmailSenderConfiguration {

  @Bean
  @ConditionalOnProperty(prefix = "app.mail", name = "enabled", havingValue = "true")
  public EmailSenderPort smtpEmailSender(
      JavaMailSender mailSender,
      TemplateEngine templateEngine,
      EmailProperties emailProperties) {
    return new SmtpEmailSender(mailSender, templateEngine, emailProperties);
  }

  @Bean
  @ConditionalOnProperty(prefix = "app.mail", name = "enabled", havingValue = "false", matchIfMissing = true)
  public EmailSenderPort noopEmailSender(EmailProperties emailProperties) {
    return new NoopEmailSender(emailProperties);
  }
}
