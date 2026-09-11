package com.tiagorcunha.mykanban.backend.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.tiagorcunha.mykanban.backend.common.infrastructure.security.JwtTokenService;
import com.tiagorcunha.mykanban.backend.common.infrastructure.security.TokenProperties;
import com.tiagorcunha.mykanban.backend.common.infrastructure.security.TokenPurpose;
import com.tiagorcunha.mykanban.backend.user.domain.model.User;
import com.tiagorcunha.mykanban.backend.user.infrastructure.persistence.SpringDataUserRepository;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class EmailVerificationIntegrationTests {

  @LocalServerPort
  private int port;

  @Autowired
  private TestRestTemplate restTemplate;

  @Autowired
  private SpringDataUserRepository userRepository;

  @Autowired
  private PasswordEncoder passwordEncoder;

  @Autowired
  private JwtTokenService jwtTokenService;

  @Autowired
  private TokenProperties tokenProperties;

  @BeforeEach
  void cleanUsers() {
    userRepository.deleteAll();
  }

  @Test
  void shouldBlockLoginUntilEmailIsVerified() {
    long userId = register("tiago@example.com", "secret-password");

    assertThat(loginStatus("tiago@example.com", "secret-password"))
        .isEqualTo(HttpStatus.FORBIDDEN);

    String verificationToken = generateToken(userId, TokenPurpose.EMAIL_VERIFICATION,
        tokenProperties.getVerificationTtlMinutes());
    ResponseEntity<String> verifyResponse = restTemplate.postForEntity(
        url("/auth/verify-email"),
        jsonBody(Map.of("token", verificationToken)),
        String.class);

    assertThat(verifyResponse.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    assertThat(loginStatus("tiago@example.com", "secret-password"))
        .isEqualTo(HttpStatus.OK);
  }

  @Test
  void shouldRejectExpiredOrForeignPurposeVerificationToken() {
    long userId = register("tiago@example.com", "secret-password");

    String resetToken = generateToken(userId, TokenPurpose.PASSWORD_RESET,
        tokenProperties.getResetTtlMinutes());
    ResponseEntity<String> wrongPurposeResponse = restTemplate.postForEntity(
        url("/auth/verify-email"),
        jsonBody(Map.of("token", resetToken)),
        String.class);

    assertThat(wrongPurposeResponse.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);

    String expiredToken = generateToken(userId, TokenPurpose.EMAIL_VERIFICATION, -1);
    ResponseEntity<String> expiredResponse = restTemplate.postForEntity(
        url("/auth/verify-email"),
        jsonBody(Map.of("token", expiredToken)),
        String.class);

    assertThat(expiredResponse.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
  }

  @Test
  void shouldResendVerificationEmailForUnverifiedAccount() {
    register("tiago@example.com", "secret-password");

    ResponseEntity<String> response = restTemplate.postForEntity(
        url("/auth/resend-verification"),
        jsonBody(Map.of("email", "tiago@example.com")),
        String.class);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
  }

  @Test
  void shouldNotAcceptOneTimeTokensAsBearerTokens() {
    long userId = register("tiago@example.com", "secret-password");

    String verificationToken = generateToken(userId, TokenPurpose.EMAIL_VERIFICATION,
        tokenProperties.getVerificationTtlMinutes());
    ResponseEntity<String> verificationAsBearer = restTemplate.exchange(
        url("/boards"),
        HttpMethod.GET,
        new HttpEntity<>(bearerHeaders(verificationToken)),
        String.class);
    assertThat(verificationAsBearer.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);

    User user = userRepository.findById(userId).orElseThrow();
    user.setEmailVerified(true);
    userRepository.save(user);

    String resetToken = generateToken(userId, TokenPurpose.PASSWORD_RESET,
        tokenProperties.getResetTtlMinutes());
    ResponseEntity<String> resetAsBearer = restTemplate.exchange(
        url("/boards"),
        HttpMethod.GET,
        new HttpEntity<>(bearerHeaders(resetToken)),
        String.class);
    assertThat(resetAsBearer.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
  }

  @Test
  void shouldResetPasswordThroughForgotPasswordFlow() {
    long userId = register("tiago@example.com", "old-password");
    verifyEmail(userId);

    ResponseEntity<String> forgotResponse = restTemplate.postForEntity(
        url("/auth/forgot-password"),
        jsonBody(Map.of("email", "tiago@example.com")),
        String.class);
    assertThat(forgotResponse.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

    String resetToken = generateToken(userId, TokenPurpose.PASSWORD_RESET,
        tokenProperties.getResetTtlMinutes());
    ResponseEntity<String> resetResponse = restTemplate.postForEntity(
        url("/auth/reset-password"),
        jsonBody(Map.of("token", resetToken, "newPassword", "brand-new-password")),
        String.class);
    assertThat(resetResponse.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

    assertThat(loginStatus("tiago@example.com", "old-password"))
        .isEqualTo(HttpStatus.UNAUTHORIZED);
    assertThat(loginStatus("tiago@example.com", "brand-new-password"))
        .isEqualTo(HttpStatus.OK);
  }

  @Test
  void shouldChangePasswordOnlyWhenCurrentPasswordMatches() {
    long userId = register("tiago@example.com", "original-password");
    verifyEmail(userId);
    String token = loginAndGetToken("tiago@example.com", "original-password");

    ResponseEntity<String> wrongCurrent = restTemplate.exchange(
        url("/auth/password"),
        HttpMethod.PUT,
        new HttpEntity<>(Map.of(
            "currentPassword", "wrong-password",
            "newPassword", "replacement-password"), bearerHeaders(token)),
        String.class);
    assertThat(wrongCurrent.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);

    ResponseEntity<String> correctCurrent = restTemplate.exchange(
        url("/auth/password"),
        HttpMethod.PUT,
        new HttpEntity<>(Map.of(
            "currentPassword", "original-password",
            "newPassword", "replacement-password"), bearerHeaders(token)),
        String.class);
    assertThat(correctCurrent.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

    assertThat(loginStatus("tiago@example.com", "original-password"))
        .isEqualTo(HttpStatus.UNAUTHORIZED);
    assertThat(loginStatus("tiago@example.com", "replacement-password"))
        .isEqualTo(HttpStatus.OK);
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private long register(String email, String password) {
    ResponseEntity<Map> response = restTemplate.postForEntity(
        url("/auth/register"),
        jsonBody(Map.of(
            "fullName", "Tiago Cunha",
            "email", email,
            "password", password)),
        Map.class);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).isNotNull();
    return ((Number) response.getBody().get("id")).longValue();
  }

  private void verifyEmail(long userId) {
    String verificationToken = generateToken(userId, TokenPurpose.EMAIL_VERIFICATION,
        tokenProperties.getVerificationTtlMinutes());
    ResponseEntity<String> response = restTemplate.postForEntity(
        url("/auth/verify-email"),
        jsonBody(Map.of("token", verificationToken)),
        String.class);
    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
  }

  @SuppressWarnings({ "rawtypes", "unchecked" })
  private String loginAndGetToken(String email, String password) {
    ResponseEntity<Map> response = restTemplate.postForEntity(
        url("/auth/login"),
        jsonBody(Map.of("email", email, "password", password)),
        Map.class);
    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).isNotNull();
    return String.valueOf(response.getBody().get("accessToken"));
  }

  @SuppressWarnings({ "rawtypes", "unchecked" })
  private HttpStatusCode loginStatus(String email, String password) {
    ResponseEntity<Map> response = restTemplate.postForEntity(
        url("/auth/login"),
        jsonBody(Map.of("email", email, "password", password)),
        Map.class);
    return response.getStatusCode();
  }

  private HttpHeaders bearerHeaders(String token) {
    HttpHeaders headers = new HttpHeaders();
    headers.setBearerAuth(token);
    return headers;
  }

  private HttpEntity<Map<String, String>> jsonBody(Map<String, String> body) {
    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);
    return new HttpEntity<>(body, headers);
  }

  private String generateToken(long userId, TokenPurpose purpose, long ttlMinutes) {
    User user = userRepository.findById(userId).orElseThrow();
    return jwtTokenService.generateOneTimeToken(user, purpose, ttlMinutes);
  }

  private String url(String path) {
    return "http://localhost:" + port + path;
  }
}
