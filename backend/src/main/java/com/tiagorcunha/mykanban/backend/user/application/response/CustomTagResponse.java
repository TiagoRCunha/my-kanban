package com.tiagorcunha.mykanban.backend.user.application.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "CustomTagResponse", description = "User-defined priority tag with custom name and color")
public record CustomTagResponse(
    @Schema(example = "1")
    Long id,
    @Schema(example = "Critical")
    String name,
    @Schema(example = "#FF5733")
    String color,
    @Schema(example = "0")
    Integer position) {
}
