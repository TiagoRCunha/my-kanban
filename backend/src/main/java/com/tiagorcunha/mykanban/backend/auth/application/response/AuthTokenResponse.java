package com.tiagorcunha.mykanban.backend.auth.application.response;

public record AuthTokenResponse(
    String accessToken,
    String tokenType,
    long expiresInMinutes) {
}
