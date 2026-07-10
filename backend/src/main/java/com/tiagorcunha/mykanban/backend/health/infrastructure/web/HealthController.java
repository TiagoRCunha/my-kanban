package com.tiagorcunha.mykanban.backend.health.infrastructure.web;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/health")
@Tag(name = "Health", description = "Service health and metadata")
public class HealthController {

  private final String apiVersion;

  public HealthController(@Value("${app.api.version}") String apiVersion) {
    this.apiVersion = apiVersion;
  }

  @GetMapping
  @Operation(summary = "Get API health")
  @ApiResponse(responseCode = "200", description = "Service is healthy")
  public HealthResponse health() {
    return new HealthResponse("UP", apiVersion);
  }
}