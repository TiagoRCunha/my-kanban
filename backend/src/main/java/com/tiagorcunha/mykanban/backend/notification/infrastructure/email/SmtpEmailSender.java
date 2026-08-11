package com.tiagorcunha.mykanban.backend.notification.infrastructure.email;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import com.tiagorcunha.mykanban.backend.notification.application.dto.EmailMessage;
import com.tiagorcunha.mykanban.backend.notification.application.port.out.EmailSenderPort;

import jakarta.mail.internet.MimeMessage;

/**
 * Adapter that renders a Thymeleaf template and sends it over SMTP.
 * Only active when {@code app.mail.enabled=true}.
 */
public class SmtpEmailSender implements EmailSenderPort {

  private static final Logger LOGGER = LoggerFactory.getLogger(SmtpEmailSender.class);

  private final JavaMailSender mailSender;
  private final TemplateEngine templateEngine;
  private final EmailProperties emailProperties;

  public SmtpEmailSender(
      JavaMailSender mailSender,
      TemplateEngine templateEngine,
      EmailProperties emailProperties) {
    this.mailSender = mailSender;
    this.templateEngine = templateEngine;
    this.emailProperties = emailProperties;
  }

  @Override
  public void send(EmailMessage message) {
    try {
      MimeMessage mimeMessage = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "UTF-8");
      helper.setFrom(emailProperties.getFrom());
      helper.setTo(message.to());
      helper.setSubject(message.subject());
      helper.setText(render(message.templateName(), message.variables()), true);
      mailSender.send(mimeMessage);
      LOGGER.info("Sent email '{}' to {}", message.subject(), message.to());
    } catch (Exception exception) {
      // Emails must never break the business flow: log and continue.
      LOGGER.error("Failed to send email '{}' to {}", message.subject(), message.to(), exception);
    }
  }

  private String render(String templateName, Map<String, Object> variables) {
    Context context = new Context();
    context.setVariables(variables);
    return templateEngine.process(templateName, context);
  }
}
