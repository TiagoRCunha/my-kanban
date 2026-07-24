package com.tiagorcunha.mykanban.backend.user.domain.model;

public enum UserRole {
  SUPER_ADMIN,
  USER,
  ADMIN,
  GUEST,
  OWNER,
  DELETED,
  SYSTEM;

  public boolean isSuperAdmin() {
    return this == SUPER_ADMIN || this == ADMIN;
  }
}
