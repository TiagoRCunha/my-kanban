package com.tiagorcunha.mykanban.backend.notification.application.port.out;

import com.tiagorcunha.mykanban.backend.notification.application.dto.EmailMessage;

/**
 * Outbound port for sending email. Implemented by infrastructure adapters
 * (real SMTP sender or a no-op logger), keeping the application layer
 * independent of the mail provider.
 */
public interface EmailSenderPort {

  void send(EmailMessage message);
}
