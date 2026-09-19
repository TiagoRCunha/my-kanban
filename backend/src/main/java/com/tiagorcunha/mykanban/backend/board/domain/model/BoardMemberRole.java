package com.tiagorcunha.mykanban.backend.board.domain.model;

import java.util.EnumSet;
import java.util.Set;

public enum BoardMemberRole {
  INVITED,
  VIEW_ONLY,
  OWNER,
  GUEST;

  /**
   * Roles that can be assigned through the API. OWNER is intentionally excluded
   * because board ownership is determined by the {@code Board.owner} relationship,
   * not by a member row.
   */
  private static final Set<BoardMemberRole> ASSIGNABLE_ROLES =
      EnumSet.of(INVITED, VIEW_ONLY, GUEST);

  public boolean isAssignable() {
    return ASSIGNABLE_ROLES.contains(this);
  }
}
