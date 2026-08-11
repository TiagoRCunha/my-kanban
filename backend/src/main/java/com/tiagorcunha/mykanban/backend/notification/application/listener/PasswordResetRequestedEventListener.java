package com.tiagorcunha.mykanban.backend.notification.application.listener;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import com.tiagorcunha.mykanban.backend.notification.application.dto.EmailMessage;
import com.tiagorcunha.mykanban.backend.notification.application.port.out.EmailSenderPort;
import com.tiagorcunha.mykanban.backend.user.domain.event.PasswordResetRequestedEvent;

/**
 * Sends the password reset email with a short-lived link. Runs asynchronously
 * after the requesting transaction commits.
 */
@Component
public class PasswordResetRequestedEventListener {

  private final EmailSenderPort emailSender;
  private final String frontendUrl;

  public PasswordResetRequestedEventListener(
      EmailSenderPort emailSender,
      @Value("${app.frontend.url}") String frontendUrl) {
    this.emailSender = emailSender;
    this.frontendUrl = frontendUrl;
  }

  @Async("emailTaskExecutor")
  @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
  public void onPasswordResetRequested(PasswordResetRequestedEvent event) {
    String resetLink = frontendUrl + "/reset-password?token=" + event.resetToken();

    emailSender.send(new EmailMessage(
        event.email(),
        "MyKanban - reset your password",
        "mail/password-reset",
        Map.of(
            "fullName", event.fullName(),
            "link", resetLink,
            "frontendUrl", frontendUrl)));
  }
}
