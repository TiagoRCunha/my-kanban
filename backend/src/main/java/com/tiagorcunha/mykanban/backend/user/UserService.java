package com.tiagorcunha.mykanban.backend.user;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class UserService {

  private final UserRepository userRepository;

  public UserService(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  @Transactional(readOnly = true)
  public List<UserResponse> findAll() {
    return userRepository.findAll().stream()
        .map(UserResponse::fromEntity)
        .toList();
  }

  @Transactional(readOnly = true)
  public UserResponse findById(Long id) {
    User user = userRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));
    return UserResponse.fromEntity(user);
  }

  @Transactional
  public UserResponse create(UserRequest request) {
    if (userRepository.existsByEmail(request.email())) {
      throw new ResponseStatusException(CONFLICT, "Email already in use");
    }

    User user = new User();
    user.setFullName(request.fullName());
    user.setEmail(request.email());
    user.setPasswordHash(request.passwordHash());
    user.setAvatarUrl(request.avatarUrl());
    user.setCreatedAt(LocalDateTime.now());
    user.setUpdatedAt(LocalDateTime.now());

    return UserResponse.fromEntity(userRepository.save(user));
  }

  @Transactional
  public UserResponse update(Long id, UserRequest request) {
    User user = userRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));

    userRepository.findByEmail(request.email())
        .filter(other -> !other.getId().equals(id))
        .ifPresent(other -> {
          throw new ResponseStatusException(CONFLICT, "Email already in use");
        });

    user.setFullName(request.fullName());
    user.setEmail(request.email());
    user.setPasswordHash(request.passwordHash());
    user.setAvatarUrl(request.avatarUrl());
    user.setUpdatedAt(LocalDateTime.now());

    return UserResponse.fromEntity(userRepository.save(user));
  }

  @Transactional
  public void delete(Long id) {
    if (!userRepository.existsById(id)) {
      throw new ResponseStatusException(NOT_FOUND, "User not found");
    }
    userRepository.deleteById(id);
  }
}
