package com.tiagorcunha.mykanban.backend.common.infrastructure.security;

public record AuthenticatedUserPrincipal(Long id, String email) {
}
