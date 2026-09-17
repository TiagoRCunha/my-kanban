import { BoardMemberRole } from './board-member.entity';

/**
 * Granular permissions derived from the current user's role on a board.
 * The board owner (identified by {@code Board.owner}) receives full access;
 * members are granted capabilities based on their {@code BoardMemberRole}.
 */
export type BoardPermissions = {
  /** Whether the board is open for any kind of editing (tasks, columns, drag). */
  isEditable: boolean;
  /** Can create new tasks. */
  canCreateTask: boolean;
  /** Can open the task editor and modify tasks. */
  canEditTask: boolean;
  /** Can move tasks between columns via drag-and-drop. */
  canMoveTask: boolean;
  /** Can reorder tasks within a column via drag-and-drop. */
  canReorderTasks: boolean;
  /** Can create, rename, delete, and reorder columns. */
  canManageColumns: boolean;
  /** Can invite, change roles, or remove members. */
  canManageMembers: boolean;
};

const EDITABLE_ROLE = 'GUEST';

/**
 * Computes the board permissions for the given member role and ownership flag.
 *
 * @param role the current user's {@code BoardMemberRole} on the board, or null
 *   when the user is not a member.
 * @param isOwner whether the current user owns the board.
 */
export function getBoardPermissions(
  role: BoardMemberRole | null,
  isOwner: boolean,
): BoardPermissions {
  if (isOwner) {
    return {
      isEditable: true,
      canCreateTask: true,
      canEditTask: true,
      canMoveTask: true,
      canReorderTasks: true,
      canManageColumns: true,
      canManageMembers: true,
    };
  }

  const isEditable = role === EDITABLE_ROLE;

  return {
    isEditable,
    canCreateTask: isEditable,
    canEditTask: isEditable,
    canMoveTask: isEditable,
    canReorderTasks: isEditable,
    canManageColumns: false,
    canManageMembers: false,
  };
}

/** Convenience value representing full permissions (used for the owner). */
export const OWNER_PERMISSIONS: BoardPermissions = getBoardPermissions(null, true);

/** Convenience value representing read-only permissions (non-editable member). */
export const READ_ONLY_PERMISSIONS: BoardPermissions = getBoardPermissions('VIEW_ONLY', false);