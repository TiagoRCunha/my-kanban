package com.tiagorcunha.mykanban.backend.common.infrastructure.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.tiagorcunha.mykanban.backend.user.domain.model.User;

import io.jsonwebtoken.JwtException;

class JwtTokenServiceTest {

  private static final long VERIFICATION_TTL_MINUTES = 60;
  private static final long RESET_TTL_MINUTES = 15;

  private JwtTokenService tokenService;
  private User user;

  @BeforeEach
  void setUp() {
    JwtProperties properties = new JwtProperties();
    properties.setSecret("test-only-secret-that-is-longer-than-thirty-two-chars-1234567890");
    properties.setExpirationMinutes(120);
    tokenService = new JwtTokenService(properties);

    user = new User();
    user.setId(42L);
    user.setEmail("tiago@example.com");
  }

  @Test
  void accessTokenCarriesAccessPurpose() {
    String token = tokenService.generateToken(user);

    assertThat(tokenService.extractPurpose(token)).isEqualTo(TokenPurpose.ACCESS);
    assertThat(tokenService.extractSubject(token)).isEqualTo("tiago@example.com");
    assertThat(tokenService.extractUserId(token)).isEqualTo(42L);
  }

  @Test
  void oneTimeTokenCarriesItsMintedPurpose() {
    String token = tokenService.generateOneTimeToken(
        user, TokenPurpose.EMAIL_VERIFICATION, VERIFICATION_TTL_MINUTES);

    assertThat(tokenService.extractPurpose(token)).isEqualTo(TokenPurpose.EMAIL_VERIFICATION);
    assertThat(tokenService.extractUserId(token)).isEqualTo(42L);
  }

  @Test
  void tokenIsValidOnlyForThePurposeItWasMintedFor() {
    String verificationToken = tokenService.generateOneTimeToken(
        user, TokenPurpose.EMAIL_VERIFICATION, VERIFICATION_TTL_MINUTES);

    assertThat(tokenService.isTokenValidForPurpose(verificationToken, TokenPurpose.EMAIL_VERIFICATION))
        .isTrue();
    assertThat(tokenService.isTokenValidForPurpose(verificationToken, TokenPurpose.PASSWORD_RESET))
        .isFalse();
    assertThat(tokenService.isTokenValidForPurpose(verificationToken, TokenPurpose.ACCESS))
        .isFalse();
  }

  @Test
  void anAccessTokenIsNeverValidAsAOneTimeToken() {
    String accessToken = tokenService.generateToken(user);

    assertThat(tokenService.isTokenValidForPurpose(accessToken, TokenPurpose.EMAIL_VERIFICATION))
        .isFalse();
    assertThat(tokenService.isTokenValidForPurpose(accessToken, TokenPurpose.PASSWORD_RESET))
        .isFalse();
  }

  @Test
  void expiredOneTimeTokenIsRejectedForItsOwnPurpose() {
    String expiredToken = tokenService.generateOneTimeToken(user, TokenPurpose.PASSWORD_RESET, -1);

    assertThat(tokenService.isTokenValidForPurpose(expiredToken, TokenPurpose.PASSWORD_RESET))
        .isFalse();
  }

  @Test
  void malformedTokenThrowsJwtExceptionOnPurposeExtraction() {
    assertThatThrownBy(() -> tokenService.extractPurpose("not.a.jwt"))
        .isInstanceOf(JwtException.class);
  }

  @Test
  void accessTokenValidatesSubjectAndUserId() {
    String token = tokenService.generateToken(user);

    assertThat(tokenService.isTokenValid(token, "tiago@example.com", 42L)).isTrue();
    assertThat(tokenService.isTokenValid(token, "other@example.com", 42L)).isFalse();
    assertThat(tokenService.isTokenValid(token, "tiago@example.com", 43L)).isFalse();
  }
}
