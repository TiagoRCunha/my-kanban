package com.tiagorcunha.mykanban.backend.common.infrastructure.web;

import java.time.Instant;
import java.util.Map;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "ApiErrorResponse", description = "Standard error payload")
public record ApiErrorResponse(
    @Schema(description = "Timestamp when the error happened", example = "2026-07-05T11:05:21.041Z")
    Instant timestamp,
    @Schema(description = "HTTP status code", example = "400")
    int status,
    @Schema(description = "HTTP reason phrase", example = "Bad Request")
    String error,
    @Schema(description = "High-level error message", example = "Validation failed")
    String message,
    @Schema(description = "Validation errors by field when status is 400")
    Map<String, String> fieldErrors) {
}