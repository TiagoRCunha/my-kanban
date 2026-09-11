package com.tiagorcunha.mykanban.backend.user.application.response;

import java.time.LocalDateTime;
import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "UserConfigResponse", description = "User configuration with preferences")
public record UserConfigResponse(
    @Schema(example = "1")
    Long id,
    @Schema(example = "1")
    Long userId,
    @Schema(example = "true")
    Boolean darkMode,
    @Schema(description = "Default number of tasks shown per column", example = "10")
    Integer defaultTaskLimit,
    @Schema(description = "Default columns for new boards")
    List<StartupColumnResponse> startupColumns,
    @Schema(description = "Custom priority tags")
    List<CustomTagResponse> customTags,
    @Schema(example = "2026-07-05T10:21:33")
    LocalDateTime createdAt,
    @Schema(example = "2026-07-05T11:02:10")
    LocalDateTime updatedAt) {
}
