package com.tiagorcunha.mykanban.backend.common.infrastructure.web;

import java.time.Instant;
import java.util.Map;

public record ApiErrorResponse(
    Instant timestamp,
    int status,
    String error,
    String message,
    Map<String, String> fieldErrors) {
}