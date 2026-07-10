package com.tiagorcunha.mykanban.backend.health.infrastructure.web;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "HealthResponse", description = "Basic API health information")
public record HealthResponse(
    @Schema(description = "Service status", example = "UP")
    String status,
    @Schema(description = "Current API semantic version", example = "1.0.1")
    String version) {
}