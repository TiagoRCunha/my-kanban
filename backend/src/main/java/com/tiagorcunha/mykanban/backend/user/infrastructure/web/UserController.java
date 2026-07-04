package com.tiagorcunha.mykanban.backend.user.infrastructure.web;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.tiagorcunha.mykanban.backend.user.application.port.in.CreateUserUseCase;
import com.tiagorcunha.mykanban.backend.user.application.port.in.DeleteUserUseCase;
import com.tiagorcunha.mykanban.backend.user.application.port.in.FindUserByIdUseCase;
import com.tiagorcunha.mykanban.backend.user.application.port.in.ListUsersUseCase;
import com.tiagorcunha.mykanban.backend.user.application.port.in.UpdateUserUseCase;
import com.tiagorcunha.mykanban.backend.user.application.response.UserResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/users")
@Validated
public class UserController {

  private final ListUsersUseCase listUsersUseCase;
  private final FindUserByIdUseCase findUserByIdUseCase;
  private final CreateUserUseCase createUserUseCase;
  private final UpdateUserUseCase updateUserUseCase;
  private final DeleteUserUseCase deleteUserUseCase;

  public UserController(
      ListUsersUseCase listUsersUseCase,
      FindUserByIdUseCase findUserByIdUseCase,
      CreateUserUseCase createUserUseCase,
      UpdateUserUseCase updateUserUseCase,
      DeleteUserUseCase deleteUserUseCase) {
    this.listUsersUseCase = listUsersUseCase;
    this.findUserByIdUseCase = findUserByIdUseCase;
    this.createUserUseCase = createUserUseCase;
    this.updateUserUseCase = updateUserUseCase;
    this.deleteUserUseCase = deleteUserUseCase;
  }

  @GetMapping
  public List<UserResponse> findAll() {
    return listUsersUseCase.findAll();
  }

  @GetMapping("/{id}")
  public UserResponse findById(@PathVariable Long id) {
    return findUserByIdUseCase.findById(id);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public UserResponse create(@Valid @RequestBody UserRequest request) {
    return createUserUseCase.create(request.toCommand());
  }

  @PutMapping("/{id}")
  public UserResponse update(@PathVariable Long id, @Valid @RequestBody UserRequest request) {
    return updateUserUseCase.update(id, request.toCommand());
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable Long id) {
    deleteUserUseCase.delete(id);
  }
}