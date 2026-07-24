package com.tiagorcunha.mykanban.backend.common.infrastructure.security;

import java.io.IOException;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.tiagorcunha.mykanban.backend.user.application.port.out.UserRepositoryPort;
import com.tiagorcunha.mykanban.backend.user.domain.model.User;

import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

  private static final String AUTH_HEADER = "Authorization";
  private static final String BEARER_PREFIX = "Bearer ";

  private final JwtTokenService jwtTokenService;
  private final UserRepositoryPort userRepository;

  public JwtAuthenticationFilter(JwtTokenService jwtTokenService, UserRepositoryPort userRepository) {
    this.jwtTokenService = jwtTokenService;
    this.userRepository = userRepository;
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request,
      HttpServletResponse response,
      FilterChain filterChain) throws ServletException, IOException {

    String authHeader = request.getHeader(AUTH_HEADER);

    if (authHeader == null || !authHeader.startsWith(BEARER_PREFIX)) {
      filterChain.doFilter(request, response);
      return;
    }

    String token = authHeader.substring(BEARER_PREFIX.length());

    try {
      String email = jwtTokenService.extractSubject(token);
      Long userId = jwtTokenService.extractUserId(token);

      if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
        User user = userId == null ? null : userRepository.findById(userId).orElse(null);
        boolean tokenValid = user != null
            && jwtTokenService.isTokenValid(token, user.getEmail(), user.getId())
            && user.getEmail().equals(email);

        if (tokenValid) {
          UsernamePasswordAuthenticationToken authentication =
              new UsernamePasswordAuthenticationToken(
                  new AuthenticatedUserPrincipal(user.getId(), user.getEmail()),
                  null,
                  java.util.List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())));
          authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
          SecurityContextHolder.getContext().setAuthentication(authentication);
        }
      }
    } catch (JwtException | IllegalArgumentException ignored) {
      SecurityContextHolder.clearContext();
    }

    filterChain.doFilter(request, response);
  }
}
