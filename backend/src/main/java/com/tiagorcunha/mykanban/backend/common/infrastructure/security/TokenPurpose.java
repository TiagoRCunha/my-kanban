package com.tiagorcunha.mykanban.backend.common.infrastructure.security;

/**
 * Kind of JWT issued by the application. The purpose is carried in the {@code typ}
 * claim so a token minted for one flow (e.g. password reset) can never be used
 * for another (e.g. as an access token).
 */
public enum TokenPurpose {

  ACCESS,
  EMAIL_VERIFICATION,
  PASSWORD_RESET
}
