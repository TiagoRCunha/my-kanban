package com.tiagorcunha.mykanban.backend.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;
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
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.tiagorcunha.mykanban.backend.common.infrastructure.security.JwtTokenService;
import com.tiagorcunha.mykanban.backend.user.domain.model.User;
import com.tiagorcunha.mykanban.backend.user.domain.model.UserRole;
import com.tiagorcunha.mykanban.backend.user.infrastructure.persistence.SpringDataUserRepository;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class JwtAuthorizationIntegrationTests {

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

  @BeforeEach
  void cleanUsers() {
    userRepository.deleteAll();
  }

  @Test
  void shouldRejectProtectedEndpointWithoutToken() {
    ResponseEntity<String> response = restTemplate.getForEntity(url("/boards"), String.class);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
  }

  @SuppressWarnings({ "rawtypes", "unchecked" })
  @Test
  void shouldAllowProtectedEndpointWithValidJwtToken() {
    User user = persistUser("tiago@example.com", "test-password", UserRole.USER);

    HttpHeaders loginHeaders = new HttpHeaders();
    loginHeaders.setContentType(MediaType.APPLICATION_JSON);
    HttpEntity<Map<String, String>> loginRequest = new HttpEntity<>(
        Map.of("email", "tiago@example.com", "password", "test-password"),
        loginHeaders);

    ResponseEntity<Map> loginResponse = restTemplate.postForEntity(url("/auth/login"), loginRequest, Map.class);

    assertThat(loginResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(loginResponse.getBody()).isNotNull();
    assertThat(loginResponse.getBody()).containsKey("accessToken");

    String token = String.valueOf(loginResponse.getBody().get("accessToken"));
    assertThat(jwtTokenService.extractUserId(token)).isEqualTo(user.getId());

    HttpHeaders headers = new HttpHeaders();
    headers.setBearerAuth(token);

    ResponseEntity<String> boardsResponse = restTemplate.exchange(
        url("/boards"),
        HttpMethod.GET,
        new HttpEntity<>(headers),
        String.class);

    assertThat(boardsResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
  }

  @Test
  void shouldRestrictUsersListingToSuperAdminAndAllowGetByIdForAnyAuthenticatedUser() {
    User superAdmin = persistUser("super-admin@example.com", "super-pass", UserRole.SUPER_ADMIN);
    
    String normalToken = loginAndGetToken("normal@example.com", "normal-pass");
    String superToken = loginAndGetToken("super-admin@example.com", "super-pass");

    ResponseEntity<String> normalListResponse = restTemplate.exchange(
        url("/users"),
        HttpMethod.GET,
        new HttpEntity<>(bearerHeaders(normalToken)),
        String.class);

    ResponseEntity<String> superListResponse = restTemplate.exchange(
        url("/users"),
        HttpMethod.GET,
        new HttpEntity<>(bearerHeaders(superToken)),
        String.class);

    ResponseEntity<String> normalGetByIdResponse = restTemplate.exchange(
        url("/users/" + superAdmin.getId()),
        HttpMethod.GET,
        new HttpEntity<>(bearerHeaders(normalToken)),
        String.class);

    assertThat(normalListResponse.getStatusCode()).isIn(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN);
    assertThat(superListResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(normalGetByIdResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
  }

  @SuppressWarnings({ "rawtypes", "unchecked" })
  private String loginAndGetToken(String email, String password) {
    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);
    HttpEntity<Map<String, String>> loginRequest = new HttpEntity<>(
        Map.of("email", email, "password", password),
        headers);

    ResponseEntity<Map> response = restTemplate.postForEntity(url("/auth/login"), loginRequest, Map.class);
    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).isNotNull();
    return String.valueOf(response.getBody().get("accessToken"));
  }

  private HttpHeaders bearerHeaders(String token) {
    HttpHeaders headers = new HttpHeaders();
    headers.setBearerAuth(token);
    return headers;
  }

  private User persistUser(String email, String rawPassword, UserRole role) {
    User user = new User();
    user.setFullName("Tiago Cunha");
    user.setEmail(email);
    user.setPasswordHash(passwordEncoder.encode(rawPassword));
    user.setRole(role);
    user.setAvatarUrl(null);
    user.setCreatedAt(LocalDateTime.now());
    user.setUpdatedAt(LocalDateTime.now());
    return userRepository.save(user);
  }

  private String url(String path) {
    return "http://localhost:" + port + path;
  }
}
