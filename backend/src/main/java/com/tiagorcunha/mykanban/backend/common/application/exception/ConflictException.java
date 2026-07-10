package com.tiagorcunha.mykanban.backend.common.application.exception;

public class ConflictException extends RuntimeException {

  public ConflictException(String message) {
    super(message);
  }
}