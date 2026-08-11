package com.tiagorcunha.mykanban.backend.common.infrastructure.security;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Objects;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import com.tiagorcunha.mykanban.backend.user.domain.model.User;

@Component
public class JwtTokenService {

  private static final String USER_ID_CLAIM = "uid";
  private static final String PURPOSE_CLAIM = "typ";

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
      .claim(PURPOSE_CLAIM, TokenPurpose.ACCESS.name())
        .issuedAt(Date.from(now))
        .expiration(Date.from(expiresAt))
        .signWith(signingKey())
        .compact();
  }

  /**
   * Creates a short-lived token for a one-time flow such as email verification
   * or password reset. The purpose is encoded in the token and validated when
   * the token is consumed.
   */
  public String generateOneTimeToken(User user, TokenPurpose purpose, long ttlMinutes) {
    Instant now = Instant.now();
    Instant expiresAt = now.plus(ttlMinutes, ChronoUnit.MINUTES);

    return Jwts.builder()
      .subject(user.getEmail())
      .claim(USER_ID_CLAIM, user.getId())
      .claim(PURPOSE_CLAIM, purpose.name())
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

  public TokenPurpose extractPurpose(String token) {
    String purpose = extractAllClaims(token).get(PURPOSE_CLAIM, String.class);
    return purpose == null ? null : TokenPurpose.valueOf(purpose);
  }

  /**
   * True when the token is unexpired and was minted for the expected purpose.
   * Malformed, expired, or wrongly-purposed tokens yield {@code false}.
   * Note: the token's subject and user id are not cross-checked against the
   * database here; callers must still resolve the user and compare identity.
   */
  public boolean isTokenValidForPurpose(String token, TokenPurpose expectedPurpose) {
    try {
      Claims claims = extractAllClaims(token);
      return expectedPurpose.name().equals(claims.get(PURPOSE_CLAIM, String.class))
          && claims.getExpiration().after(new Date());
    } catch (JwtException | IllegalArgumentException exception) {
      return false;
    }
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
