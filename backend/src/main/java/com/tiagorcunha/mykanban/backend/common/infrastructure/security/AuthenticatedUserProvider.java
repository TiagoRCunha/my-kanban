package com.tiagorcunha.mykanban.backend.common.infrastructure.security;

import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import com.tiagorcunha.mykanban.backend.common.application.exception.UnauthorizedException;
import com.tiagorcunha.mykanban.backend.user.application.port.out.UserRepositoryPort;
import com.tiagorcunha.mykanban.backend.user.domain.model.User;

@Component
public class AuthenticatedUserProvider {

  private final UserRepositoryPort userRepository;

  public AuthenticatedUserProvider(UserRepositoryPort userRepository) {
    this.userRepository = userRepository;
  }

  public User getAuthenticatedUser() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication == null || !authentication.isAuthenticated()
        || authentication instanceof AnonymousAuthenticationToken) {
      throw new UnauthorizedException("Authentication required");
    }

    Object principal = authentication.getPrincipal();
    if (principal instanceof AuthenticatedUserPrincipal authenticatedPrincipal) {
      return userRepository.findById(authenticatedPrincipal.id())
          .orElseThrow(() -> new UnauthorizedException("Authenticated user no longer exists"));
    }

    if (principal instanceof String email && !email.isBlank()) {
      return userRepository.findByEmail(email)
          .orElseThrow(() -> new UnauthorizedException("Authenticated user no longer exists"));
    }

    throw new UnauthorizedException("Authentication required");
  }
}
