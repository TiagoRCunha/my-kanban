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

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/users")
@Validated
@Tag(name = "Users", description = "User management endpoints")
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
  @Operation(summary = "List users")
  @ApiResponse(responseCode = "200", description = "Users fetched")
  public List<UserResponse> findAll() {
    return listUsersUseCase.findAll();
  }

  @GetMapping("/{id}")
  @Operation(summary = "Get user by id")
  @ApiResponses({
      @ApiResponse(responseCode = "200", description = "User found"),
      @ApiResponse(
          responseCode = "404",
          description = "User not found",
          content = @Content(schema = @Schema(implementation = com.tiagorcunha.mykanban.backend.common.infrastructure.web.ApiErrorResponse.class)))
  })
  public UserResponse findById(@PathVariable Long id) {
    return findUserByIdUseCase.findById(id);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  @Operation(summary = "Create user")
  @ApiResponses({
      @ApiResponse(responseCode = "201", description = "User created"),
      @ApiResponse(
          responseCode = "400",
          description = "Invalid payload",
          content = @Content(schema = @Schema(implementation = com.tiagorcunha.mykanban.backend.common.infrastructure.web.ApiErrorResponse.class))),
      @ApiResponse(
          responseCode = "409",
          description = "Email already in use",
          content = @Content(schema = @Schema(implementation = com.tiagorcunha.mykanban.backend.common.infrastructure.web.ApiErrorResponse.class)))
  })
  public UserResponse create(@Valid @RequestBody UserRequest request) {
    return createUserUseCase.create(request.toCommand());
  }

  @PutMapping("/{id}")
  @Operation(summary = "Update user")
  @ApiResponses({
      @ApiResponse(responseCode = "200", description = "User updated"),
      @ApiResponse(
          responseCode = "400",
          description = "Invalid payload",
          content = @Content(schema = @Schema(implementation = com.tiagorcunha.mykanban.backend.common.infrastructure.web.ApiErrorResponse.class))),
      @ApiResponse(
          responseCode = "404",
          description = "User not found",
          content = @Content(schema = @Schema(implementation = com.tiagorcunha.mykanban.backend.common.infrastructure.web.ApiErrorResponse.class))),
      @ApiResponse(
          responseCode = "409",
          description = "Email already in use",
          content = @Content(schema = @Schema(implementation = com.tiagorcunha.mykanban.backend.common.infrastructure.web.ApiErrorResponse.class)))
  })
  public UserResponse update(@PathVariable Long id, @Valid @RequestBody UserRequest request) {
    return updateUserUseCase.update(id, request.toCommand());
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @Operation(summary = "Delete user")
  @ApiResponses({
      @ApiResponse(responseCode = "204", description = "User deleted"),
      @ApiResponse(
          responseCode = "404",
          description = "User not found",
          content = @Content(schema = @Schema(implementation = com.tiagorcunha.mykanban.backend.common.infrastructure.web.ApiErrorResponse.class)))
  })
  public void delete(@PathVariable Long id) {
    deleteUserUseCase.delete(id);
  }
}