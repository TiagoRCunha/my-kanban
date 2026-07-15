package com.tiagorcunha.mykanban.backend.common.application.exception;

public class UnauthorizedException extends RuntimeException {

  public UnauthorizedException(String message) {
    super(message);
  }
}
