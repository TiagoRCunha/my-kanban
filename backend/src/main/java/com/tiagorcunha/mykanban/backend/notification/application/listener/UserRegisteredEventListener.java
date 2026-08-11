package com.tiagorcunha.mykanban.backend.notification.application.listener;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import com.tiagorcunha.mykanban.backend.notification.application.dto.EmailMessage;
import com.tiagorcunha.mykanban.backend.notification.application.port.out.EmailSenderPort;
import com.tiagorcunha.mykanban.backend.user.domain.event.UserRegisteredEvent;

/**
 * Sends the account activation email after a new user registers. Runs
 * asynchronously, after the registration transaction commits, so a slow SMTP
 * call never blocks the request.
 */
@Component
public class UserRegisteredEventListener {

  private final EmailSenderPort emailSender;
  private final String frontendUrl;

  public UserRegisteredEventListener(
      EmailSenderPort emailSender,
      @Value("${app.frontend.url}") String frontendUrl) {
    this.emailSender = emailSender;
    this.frontendUrl = frontendUrl;
  }

  @Async("emailTaskExecutor")
  @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
  public void onUserRegistered(UserRegisteredEvent event) {
    String verificationLink =
        frontendUrl + "/verify-email?token=" + event.verificationToken();

    emailSender.send(new EmailMessage(
        event.email(),
        "Welcome to MyKanban - verify your email",
        "mail/verify-email",
        Map.of(
            "fullName", event.fullName(),
            "link", verificationLink,
            "frontendUrl", frontendUrl)));
  }
}
