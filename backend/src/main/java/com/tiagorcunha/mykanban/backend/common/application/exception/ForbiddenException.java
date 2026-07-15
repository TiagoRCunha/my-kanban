package com.tiagorcunha.mykanban.backend.common.application.exception;

public class ForbiddenException extends RuntimeException {

  public ForbiddenException(String message) {
    super(message);
  }
}
