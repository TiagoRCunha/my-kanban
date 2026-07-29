package com.tiagorcunha.mykanban.backend.user.application.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "StartupColumnResponse", description = "Default column for new boards")
public record StartupColumnResponse(
    @Schema(example = "1")
    Long id,
    @Schema(example = "Backlog")
    String title,
    @Schema(example = "0")
    Integer position) {
}
