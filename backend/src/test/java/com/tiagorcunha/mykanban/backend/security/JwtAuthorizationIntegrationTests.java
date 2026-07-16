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

import com.tiagorcunha.mykanban.backend.user.domain.model.User;
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
    persistUser("tiago@example.com", "test-password");

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

    HttpHeaders headers = new HttpHeaders();
    headers.setBearerAuth(token);

    ResponseEntity<String> boardsResponse = restTemplate.exchange(
        url("/boards"),
        HttpMethod.GET,
        new HttpEntity<>(headers),
        String.class);

    assertThat(boardsResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
  }

  private void persistUser(String email, String rawPassword) {
    User user = new User();
    user.setFullName("Tiago Cunha");
    user.setEmail(email);
    user.setPasswordHash(passwordEncoder.encode(rawPassword));
    user.setAvatarUrl(null);
    user.setCreatedAt(LocalDateTime.now());
    user.setUpdatedAt(LocalDateTime.now());
    userRepository.save(user);
  }

  private String url(String path) {
    return "http://localhost:" + port + path;
  }
}
