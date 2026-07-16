package com.tiagorcunha.mykanban.backend.user.infrastructure.seed;

import java.time.LocalDateTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.tiagorcunha.mykanban.backend.user.application.port.out.UserRepositoryPort;
import com.tiagorcunha.mykanban.backend.user.domain.model.User;
import com.tiagorcunha.mykanban.backend.user.domain.model.UserRole;

@Component
public class AdminUserSeeder implements ApplicationRunner {

  private static final Logger LOGGER = LoggerFactory.getLogger(AdminUserSeeder.class);

  private final UserRepositoryPort userRepository;
  private final PasswordEncoder passwordEncoder;

  @Value("${app.seed.admin.enabled:true}")
  private boolean enabled;

  @Value("${app.seed.admin.full-name:Tiago Admin}")
  private String fullName;

  @Value("${app.seed.admin.email:tiago.r.c.sn@hotmail.com}")
  private String email;

  @Value("${app.seed.admin.password:mypassword}")
  private String password;

  public AdminUserSeeder(UserRepositoryPort userRepository, PasswordEncoder passwordEncoder) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
  }

  @Override
  @Transactional
  public void run(ApplicationArguments args) {
    if (!enabled) {
      return;
    }

    if (userRepository.existsByEmail(email)) {
      return;
    }

    LocalDateTime now = LocalDateTime.now();
    User admin = new User();
    admin.setFullName(fullName);
    admin.setEmail(email);
    admin.setPasswordHash(passwordEncoder.encode(password));
    admin.setRole(UserRole.ADMIN);
    admin.setCreatedAt(now);
    admin.setUpdatedAt(now);

    userRepository.save(admin);
    LOGGER.info("Seeded startup admin user for email {}", email);
  }
}
