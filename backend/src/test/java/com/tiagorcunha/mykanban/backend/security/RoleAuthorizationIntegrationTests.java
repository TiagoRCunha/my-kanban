package com.tiagorcunha.mykanban.backend.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;
import java.util.List;
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

import com.tiagorcunha.mykanban.backend.board.domain.model.Board;
import com.tiagorcunha.mykanban.backend.board.domain.model.BoardColumn;
import com.tiagorcunha.mykanban.backend.board.domain.model.BoardMember;
import com.tiagorcunha.mykanban.backend.board.domain.model.BoardMemberRole;
import com.tiagorcunha.mykanban.backend.board.infrastructure.persistence.SpringDataBoardColumnRepository;
import com.tiagorcunha.mykanban.backend.board.infrastructure.persistence.SpringDataBoardMemberRepository;
import com.tiagorcunha.mykanban.backend.board.infrastructure.persistence.SpringDataBoardRepository;
import com.tiagorcunha.mykanban.backend.board.infrastructure.persistence.SpringDataCommentRepository;
import com.tiagorcunha.mykanban.backend.board.infrastructure.persistence.SpringDataTaskRepository;
import com.tiagorcunha.mykanban.backend.user.domain.model.User;
import com.tiagorcunha.mykanban.backend.user.domain.model.UserRole;
import com.tiagorcunha.mykanban.backend.user.infrastructure.persistence.SpringDataUserRepository;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class RoleAuthorizationIntegrationTests {

  @LocalServerPort
  private int port;

  @Autowired
  private TestRestTemplate restTemplate;

  @Autowired
  private SpringDataCommentRepository commentRepository;

  @Autowired
  private SpringDataTaskRepository taskRepository;

  @Autowired
  private SpringDataBoardColumnRepository boardColumnRepository;

  @Autowired
  private SpringDataBoardMemberRepository boardMemberRepository;

  @Autowired
  private SpringDataBoardRepository boardRepository;

  @Autowired
  private SpringDataUserRepository userRepository;

  @Autowired
  private PasswordEncoder passwordEncoder;

  @BeforeEach
  void cleanData() {
    commentRepository.deleteAll();
    taskRepository.deleteAll();
    boardColumnRepository.deleteAll();
    boardMemberRepository.deleteAll();
    boardRepository.deleteAll();
    userRepository.deleteAll();
  }

  @Test
  void nonOwnerCannotReadOrWriteBoardResources() {
    User owner = createUser("owner@example.com", "owner-pass", UserRole.USER);
    User viewer = createUser("viewer@example.com", "viewer-pass", UserRole.USER);
    Board board = createBoard(owner);
    BoardColumn column = createColumn(board, "To Do", 0);
    createMembership(board, viewer, BoardMemberRole.VIEW_ONLY);

    HttpHeaders viewerHeaders = bearerHeaders(loginAndGetToken("viewer@example.com", "viewer-pass"));

    ResponseEntity<String> boardResponse = restTemplate.exchange(
        url("/boards/" + board.getId()),
        HttpMethod.GET,
        new HttpEntity<>(viewerHeaders),
        String.class);

    ResponseEntity<String> columnResponse = restTemplate.exchange(
        url("/boards/" + board.getId() + "/columns"),
        HttpMethod.GET,
        new HttpEntity<>(viewerHeaders),
        String.class);

    Map<String, Object> createTaskPayload = Map.of(
        "title", "Viewer task",
        "description", "Should fail",
        "priority", "MEDIUM",
        "position", 1,
        "estimatedHours", 2.0,
        "assigneeIds", List.of());

    HttpHeaders jsonHeaders = bearerJsonHeaders(loginAndGetToken("viewer@example.com", "viewer-pass"));

    ResponseEntity<String> createTaskResponse = restTemplate.exchange(
        url("/columns/" + column.getId() + "/tasks"),
        HttpMethod.POST,
        new HttpEntity<>(createTaskPayload, jsonHeaders),
        String.class);

    assertThat(boardResponse.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    assertThat(columnResponse.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    assertThat(createTaskResponse.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
  }

  @Test
  @SuppressWarnings({ "rawtypes", "unchecked" })
  void ownerCanCrudTaskAndComment() {
    User owner = createUser("owner2@example.com", "owner-pass", UserRole.USER);
    User outsider = createUser("outsider@example.com", "outsider-pass", UserRole.USER);

    Board board = createBoard(owner);
    BoardColumn column = createColumn(board, "Doing", 0);
    createMembership(board, outsider, BoardMemberRole.INVITED);

    HttpHeaders ownerJsonHeaders = bearerJsonHeaders(loginAndGetToken("owner2@example.com", "owner-pass"));

    Map<String, Object> createTaskPayload = Map.of(
        "title", "Invited task",
        "description", "Created by invited",
        "priority", "HIGH",
        "position", 0,
        "estimatedHours", 3.5,
        "assigneeIds", List.of());

    ResponseEntity<Map> createTaskResponse = restTemplate.exchange(
        url("/columns/" + column.getId() + "/tasks"),
        HttpMethod.POST,
      new HttpEntity<>(createTaskPayload, ownerJsonHeaders),
        Map.class);

    assertThat(createTaskResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
    Long createdTaskId = ((Number) createTaskResponse.getBody().get("id")).longValue();

    Map<String, Object> updateTaskPayload = Map.of(
        "title", "Invited task updated",
        "description", "Updated",
        "priority", "LOW",
        "position", 0,
        "estimatedHours", 1.0,
        "assigneeIds", List.of());

    ResponseEntity<String> updateTaskResponse = restTemplate.exchange(
        url("/columns/" + column.getId() + "/tasks/" + createdTaskId),
        HttpMethod.PUT,
      new HttpEntity<>(updateTaskPayload, ownerJsonHeaders),
        String.class);

    assertThat(updateTaskResponse.getStatusCode()).isEqualTo(HttpStatus.OK);

    Map<String, Object> createCommentPayload = Map.of("content", "Invited comment");
    ResponseEntity<Map> createCommentResponse = restTemplate.exchange(
        url("/tasks/" + createdTaskId + "/comments"),
        HttpMethod.POST,
      new HttpEntity<>(createCommentPayload, ownerJsonHeaders),
        Map.class);

    assertThat(createCommentResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
    Long commentId = ((Number) createCommentResponse.getBody().get("id")).longValue();

    Map<String, Object> updateCommentPayload = Map.of("content", "Updated comment");
    ResponseEntity<String> updateCommentResponse = restTemplate.exchange(
        url("/tasks/" + createdTaskId + "/comments/" + commentId),
        HttpMethod.PUT,
      new HttpEntity<>(updateCommentPayload, ownerJsonHeaders),
        String.class);

    assertThat(updateCommentResponse.getStatusCode()).isEqualTo(HttpStatus.OK);

    ResponseEntity<String> deleteCommentResponse = restTemplate.exchange(
        url("/tasks/" + createdTaskId + "/comments/" + commentId),
        HttpMethod.DELETE,
      new HttpEntity<>(ownerJsonHeaders),
        String.class);

    ResponseEntity<String> deleteTaskResponse = restTemplate.exchange(
        url("/columns/" + column.getId() + "/tasks/" + createdTaskId),
        HttpMethod.DELETE,
      new HttpEntity<>(ownerJsonHeaders),
        String.class);

    assertThat(deleteCommentResponse.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    assertThat(deleteTaskResponse.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
  }

  @Test
  void invitedCannotManageBoardOrColumns() {
    User owner = createUser("owner3@example.com", "owner-pass", UserRole.USER);
    User invited = createUser("invited3@example.com", "invited-pass", UserRole.USER);

    Board board = createBoard(owner);
    createMembership(board, invited, BoardMemberRole.INVITED);

    HttpHeaders invitedJsonHeaders = bearerJsonHeaders(loginAndGetToken("invited3@example.com", "invited-pass"));

    Map<String, Object> updateBoardPayload = Map.of(
        "title", "Changed title",
        "description", "Changed description");

    ResponseEntity<String> updateBoardResponse = restTemplate.exchange(
        url("/boards/" + board.getId()),
        HttpMethod.PUT,
        new HttpEntity<>(updateBoardPayload, invitedJsonHeaders),
        String.class);

    Map<String, Object> createColumnPayload = Map.of(
        "title", "New column",
        "position", 1);

    ResponseEntity<String> createColumnResponse = restTemplate.exchange(
        url("/boards/" + board.getId() + "/columns"),
        HttpMethod.POST,
        new HttpEntity<>(createColumnPayload, invitedJsonHeaders),
        String.class);

    assertThat(updateBoardResponse.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    assertThat(createColumnResponse.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
  }

  private User createUser(String email, String rawPassword, UserRole role) {
    User user = new User();
    user.setFullName(email.split("@")[0]);
    user.setEmail(email);
    user.setPasswordHash(passwordEncoder.encode(rawPassword));
    user.setRole(role);
    user.setCreatedAt(LocalDateTime.now());
    user.setUpdatedAt(LocalDateTime.now());
    return userRepository.save(user);
  }

  private Board createBoard(User owner) {
    Board board = new Board();
    board.setTitle("Security Board");
    board.setDescription("Board for RBAC tests");
    board.setOwner(owner);
    board.setCreatedAt(LocalDateTime.now());
    board.setUpdatedAt(LocalDateTime.now());
    return boardRepository.save(board);
  }

  private BoardColumn createColumn(Board board, String title, int position) {
    BoardColumn column = new BoardColumn();
    column.setBoard(board);
    column.setTitle(title);
    column.setPosition(position);
    column.setCreatedAt(LocalDateTime.now());
    return boardColumnRepository.save(column);
  }

  @SuppressWarnings("unused")
  private BoardMember createMembership(Board board, User user, BoardMemberRole role) {
    BoardMember boardMember = new BoardMember();
    boardMember.setBoard(board);
    boardMember.setUser(user);
    boardMember.setRole(role);
    return boardMemberRepository.save(boardMember);
  }

  @SuppressWarnings({ "rawtypes", "unchecked" })
  private String loginAndGetToken(String email, String password) {
    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);

    ResponseEntity<Map> loginResponse = restTemplate.postForEntity(
        url("/auth/login"),
        new HttpEntity<>(Map.of("email", email, "password", password), headers),
        Map.class);

    assertThat(loginResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(loginResponse.getBody()).isNotNull();
    return String.valueOf(loginResponse.getBody().get("accessToken"));
  }

  private HttpHeaders bearerHeaders(String token) {
    HttpHeaders headers = new HttpHeaders();
    headers.setBearerAuth(token);
    return headers;
  }

  private HttpHeaders bearerJsonHeaders(String token) {
    HttpHeaders headers = bearerHeaders(token);
    headers.setContentType(MediaType.APPLICATION_JSON);
    return headers;
  }

  private String url(String path) {
    return "http://localhost:" + port + path;
  }
}
