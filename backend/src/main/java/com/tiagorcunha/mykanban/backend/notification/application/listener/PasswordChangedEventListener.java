package com.tiagorcunha.mykanban.backend.notification.application.listener;

import java.util.Map;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import com.tiagorcunha.mykanban.backend.notification.application.dto.EmailMessage;
import com.tiagorcunha.mykanban.backend.notification.application.port.out.EmailSenderPort;
import com.tiagorcunha.mykanban.backend.user.domain.event.PasswordChangedEvent;

/**
 * Sends a confirmation email after a password is changed. Runs asynchronously
 * after the password-update transaction commits.
 */
@Component
public class PasswordChangedEventListener {

  private final EmailSenderPort emailSender;

  public PasswordChangedEventListener(EmailSenderPort emailSender) {
    this.emailSender = emailSender;
  }

  @Async("emailTaskExecutor")
  @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
  public void onPasswordChanged(PasswordChangedEvent event) {
    emailSender.send(new EmailMessage(
        event.email(),
        "MyKanban - your password was changed",
        "mail/password-changed",
        Map.of("fullName", event.fullName())));
  }
}
