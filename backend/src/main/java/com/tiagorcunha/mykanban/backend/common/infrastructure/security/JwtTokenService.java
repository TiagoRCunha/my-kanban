package com.tiagorcunha.mykanban.backend.common.infrastructure.security;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Objects;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import com.tiagorcunha.mykanban.backend.user.domain.model.User;

@Component
public class JwtTokenService {

  private static final String USER_ID_CLAIM = "uid";

  private final JwtProperties jwtProperties;

  public JwtTokenService(JwtProperties jwtProperties) {
    this.jwtProperties = jwtProperties;
  }

    public String generateToken(User user) {
    Instant now = Instant.now();
    Instant expiresAt = now.plus(jwtProperties.getExpirationMinutes(), ChronoUnit.MINUTES);

    return Jwts.builder()
      .subject(user.getEmail())
      .claim(USER_ID_CLAIM, user.getId())
        .issuedAt(Date.from(now))
        .expiration(Date.from(expiresAt))
        .signWith(signingKey())
        .compact();
  }

  public String extractSubject(String token) {
    return extractAllClaims(token).getSubject();
  }

  public Long extractUserId(String token) {
    Object rawValue = extractAllClaims(token).get(USER_ID_CLAIM);
    if (rawValue instanceof Number numberValue) {
      return numberValue.longValue();
    }
    if (rawValue instanceof String stringValue) {
      return Long.valueOf(stringValue);
    }
    return null;
  }

  public boolean isTokenValid(String token, String expectedSubject, Long expectedUserId) {
    Claims claims = extractAllClaims(token);
    Long tokenUserId = extractUserId(token);
    return expectedSubject.equals(claims.getSubject())
        && Objects.equals(expectedUserId, tokenUserId)
        && claims.getExpiration().after(new Date());
  }

  private Claims extractAllClaims(String token) {
    return Jwts.parser()
        .verifyWith(signingKey())
        .build()
        .parseSignedClaims(token)
        .getPayload();
  }

  private SecretKey signingKey() {
    return Keys.hmacShaKeyFor(jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8));
  }
}
