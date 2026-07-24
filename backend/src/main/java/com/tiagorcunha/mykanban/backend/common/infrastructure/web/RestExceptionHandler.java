package com.tiagorcunha.mykanban.backend.common.infrastructure.web;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.tiagorcunha.mykanban.backend.common.application.exception.ConflictException;
import com.tiagorcunha.mykanban.backend.common.application.exception.ForbiddenException;
import com.tiagorcunha.mykanban.backend.common.application.exception.ResourceNotFoundException;
import com.tiagorcunha.mykanban.backend.common.application.exception.UnauthorizedException;

@RestControllerAdvice
public class RestExceptionHandler {

  @ExceptionHandler(ResourceNotFoundException.class)
  public ResponseEntity<ApiErrorResponse> handleNotFound(ResourceNotFoundException exception) {
    return buildResponse(HttpStatus.NOT_FOUND, exception.getMessage(), Map.of());
  }

  @ExceptionHandler(ConflictException.class)
  public ResponseEntity<ApiErrorResponse> handleConflict(ConflictException exception) {
    return buildResponse(HttpStatus.CONFLICT, exception.getMessage(), Map.of());
  }

  @ExceptionHandler(ForbiddenException.class)
  public ResponseEntity<ApiErrorResponse> handleForbidden(ForbiddenException exception) {
    return buildResponse(HttpStatus.FORBIDDEN, exception.getMessage(), Map.of());
  }

  @ExceptionHandler(UnauthorizedException.class)
  public ResponseEntity<ApiErrorResponse> handleUnauthorized(UnauthorizedException exception) {
    return buildResponse(HttpStatus.UNAUTHORIZED, exception.getMessage(), Map.of());
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiErrorResponse> handleValidation(MethodArgumentNotValidException exception) {
    Map<String, String> fieldErrors = new LinkedHashMap<>();
    for (FieldError fieldError : exception.getBindingResult().getFieldErrors()) {
      fieldErrors.put(fieldError.getField(), fieldError.getDefaultMessage());
    }
    return buildResponse(HttpStatus.BAD_REQUEST, "Validation failed", fieldErrors);
  }

  private ResponseEntity<ApiErrorResponse> buildResponse(
      HttpStatus status,
      String message,
      Map<String, String> fieldErrors) {
    return ResponseEntity.status(status)
        .body(new ApiErrorResponse(
            Instant.now(),
            status.value(),
            status.getReasonPhrase(),
            message,
            fieldErrors));
  }
}