package com.tiagorcunha.mykanban.backend.user.infrastructure.web;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.tiagorcunha.mykanban.backend.user.application.port.in.CreateCustomTagUseCase;
import com.tiagorcunha.mykanban.backend.user.application.port.in.DeleteCustomTagUseCase;
import com.tiagorcunha.mykanban.backend.user.application.port.in.GetUserConfigUseCase;
import com.tiagorcunha.mykanban.backend.user.application.port.in.ListCustomTagsUseCase;
import com.tiagorcunha.mykanban.backend.user.application.port.in.ListStartupColumnsUseCase;
import com.tiagorcunha.mykanban.backend.user.application.port.in.SaveStartupColumnsUseCase;
import com.tiagorcunha.mykanban.backend.user.application.port.in.UpdateCustomTagUseCase;
import com.tiagorcunha.mykanban.backend.user.application.port.in.UpdateUserConfigUseCase;
import com.tiagorcunha.mykanban.backend.user.application.response.CustomTagResponse;
import com.tiagorcunha.mykanban.backend.user.application.response.StartupColumnResponse;
import com.tiagorcunha.mykanban.backend.user.application.response.UserConfigResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/users/{userId}/config")
@Validated
@Tag(name = "User Configuration", description = "User preferences, startup columns, and custom tags")
public class UserConfigController {

  private final GetUserConfigUseCase getUserConfigUseCase;
  private final UpdateUserConfigUseCase updateUserConfigUseCase;
  private final ListStartupColumnsUseCase listStartupColumnsUseCase;
  private final SaveStartupColumnsUseCase saveStartupColumnsUseCase;
  private final ListCustomTagsUseCase listCustomTagsUseCase;
  private final CreateCustomTagUseCase createCustomTagUseCase;
  private final UpdateCustomTagUseCase updateCustomTagUseCase;
  private final DeleteCustomTagUseCase deleteCustomTagUseCase;

  public UserConfigController(
      GetUserConfigUseCase getUserConfigUseCase,
      UpdateUserConfigUseCase updateUserConfigUseCase,
      ListStartupColumnsUseCase listStartupColumnsUseCase,
      SaveStartupColumnsUseCase saveStartupColumnsUseCase,
      ListCustomTagsUseCase listCustomTagsUseCase,
      CreateCustomTagUseCase createCustomTagUseCase,
      UpdateCustomTagUseCase updateCustomTagUseCase,
      DeleteCustomTagUseCase deleteCustomTagUseCase) {
    this.getUserConfigUseCase = getUserConfigUseCase;
    this.updateUserConfigUseCase = updateUserConfigUseCase;
    this.listStartupColumnsUseCase = listStartupColumnsUseCase;
    this.saveStartupColumnsUseCase = saveStartupColumnsUseCase;
    this.listCustomTagsUseCase = listCustomTagsUseCase;
    this.createCustomTagUseCase = createCustomTagUseCase;
    this.updateCustomTagUseCase = updateCustomTagUseCase;
    this.deleteCustomTagUseCase = deleteCustomTagUseCase;
  }

  // ─── User Config ───────────────────────────────────────────────────────────

  @GetMapping
  @Operation(summary = "Get user configuration with startup columns and custom tags")
  @ApiResponse(responseCode = "200", description = "Configuration fetched")
  public UserConfigResponse getConfig(@PathVariable Long userId) {
    return getUserConfigUseCase.findByUserId(userId);
  }

  @PatchMapping
  @Operation(summary = "Partially update user configuration")
  @ApiResponses({
      @ApiResponse(responseCode = "200", description = "Configuration updated"),
      @ApiResponse(
          responseCode = "400",
          description = "Invalid payload",
          content = @Content(schema = @Schema(implementation = com.tiagorcunha.mykanban.backend.common.infrastructure.web.ApiErrorResponse.class)))
  })
  public UserConfigResponse updateConfig(
      @PathVariable Long userId,
      @Valid @RequestBody UserConfigRequest request) {
    return updateUserConfigUseCase.update(userId, request.toCommand());
  }

  // ─── Startup Columns ───────────────────────────────────────────────────────

  @GetMapping("/startup-columns")
  @Operation(summary = "List startup columns for new boards")
  @ApiResponse(responseCode = "200", description = "Startup columns fetched")
  public List<StartupColumnResponse> getStartupColumns(@PathVariable Long userId) {
    return listStartupColumnsUseCase.findStartupColumnsByUserId(userId);
  }

  @PutMapping("/startup-columns")
  @Operation(summary = "Replace all startup columns (bulk update)")
  @ApiResponses({
      @ApiResponse(responseCode = "200", description = "Startup columns replaced"),
      @ApiResponse(
          responseCode = "400",
          description = "Invalid payload",
          content = @Content(schema = @Schema(implementation = com.tiagorcunha.mykanban.backend.common.infrastructure.web.ApiErrorResponse.class)))
  })
  public List<StartupColumnResponse> replaceStartupColumns(
      @PathVariable Long userId,
      @Valid @RequestBody StartupColumnsRequest request) {
    return saveStartupColumnsUseCase.saveAll(userId, request.toCommands());
  }

  // ─── Custom Tags ───────────────────────────────────────────────────────────

  @GetMapping("/custom-tags")
  @Operation(summary = "List custom priority tags")
  @ApiResponse(responseCode = "200", description = "Custom tags fetched")
  public List<CustomTagResponse> getCustomTags(@PathVariable Long userId) {
    return listCustomTagsUseCase.findCustomTagsByUserId(userId);
  }

  @PostMapping("/custom-tags")
  @ResponseStatus(HttpStatus.CREATED)
  @Operation(summary = "Create a custom tag")
  @ApiResponses({
      @ApiResponse(responseCode = "201", description = "Tag created"),
      @ApiResponse(
          responseCode = "400",
          description = "Invalid payload",
          content = @Content(schema = @Schema(implementation = com.tiagorcunha.mykanban.backend.common.infrastructure.web.ApiErrorResponse.class))),
      @ApiResponse(
          responseCode = "409",
          description = "Position conflict",
          content = @Content(schema = @Schema(implementation = com.tiagorcunha.mykanban.backend.common.infrastructure.web.ApiErrorResponse.class)))
  })
  public CustomTagResponse createCustomTag(
      @PathVariable Long userId,
      @Valid @RequestBody CustomTagRequest request) {
    return createCustomTagUseCase.create(userId, request.toCommand());
  }

  @PutMapping("/custom-tags/{tagId}")
  @Operation(summary = "Update a custom tag")
  @ApiResponses({
      @ApiResponse(responseCode = "200", description = "Tag updated"),
      @ApiResponse(
          responseCode = "400",
          description = "Invalid payload",
          content = @Content(schema = @Schema(implementation = com.tiagorcunha.mykanban.backend.common.infrastructure.web.ApiErrorResponse.class))),
      @ApiResponse(
          responseCode = "404",
          description = "Tag not found",
          content = @Content(schema = @Schema(implementation = com.tiagorcunha.mykanban.backend.common.infrastructure.web.ApiErrorResponse.class))),
      @ApiResponse(
          responseCode = "409",
          description = "Position conflict",
          content = @Content(schema = @Schema(implementation = com.tiagorcunha.mykanban.backend.common.infrastructure.web.ApiErrorResponse.class)))
  })
  public CustomTagResponse updateCustomTag(
      @PathVariable Long userId,
      @PathVariable Long tagId,
      @Valid @RequestBody CustomTagRequest request) {
    return updateCustomTagUseCase.update(userId, tagId, request.toCommand());
  }

  @DeleteMapping("/custom-tags/{tagId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @Operation(summary = "Delete a custom tag")
  @ApiResponses({
      @ApiResponse(responseCode = "204", description = "Tag deleted"),
      @ApiResponse(
          responseCode = "404",
          description = "Tag not found",
          content = @Content(schema = @Schema(implementation = com.tiagorcunha.mykanban.backend.common.infrastructure.web.ApiErrorResponse.class)))
  })
  public void deleteCustomTag(
      @PathVariable Long userId,
      @PathVariable Long tagId) {
    deleteCustomTagUseCase.delete(userId, tagId);
  }
}
