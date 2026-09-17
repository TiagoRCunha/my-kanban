import { getBoardPermissions, OWNER_PERMISSIONS, READ_ONLY_PERMISSIONS } from './board-permissions';

describe('BoardPermissions', () => {
  it('grants full permissions to the board owner', () => {
    const permissions = getBoardPermissions(null, true);

    expect(permissions.isEditable).toBeTrue();
    expect(permissions.canCreateTask).toBeTrue();
    expect(permissions.canEditTask).toBeTrue();
    expect(permissions.canMoveTask).toBeTrue();
    expect(permissions.canReorderTasks).toBeTrue();
    expect(permissions.canManageColumns).toBeTrue();
    expect(permissions.canManageMembers).toBeTrue();
  });

  it('grants working permissions to a guest member', () => {
    const permissions = getBoardPermissions('GUEST', false);

    expect(permissions.isEditable).toBeTrue();
    expect(permissions.canCreateTask).toBeTrue();
    expect(permissions.canEditTask).toBeTrue();
    expect(permissions.canMoveTask).toBeTrue();
    expect(permissions.canReorderTasks).toBeTrue();
    expect(permissions.canManageColumns).toBeFalse();
    expect(permissions.canManageMembers).toBeFalse();
  });

  it('grants read-only permissions to a view-only member', () => {
    const permissions = getBoardPermissions('VIEW_ONLY', false);

    expect(permissions.isEditable).toBeFalse();
    expect(permissions.canCreateTask).toBeFalse();
    expect(permissions.canEditTask).toBeFalse();
    expect(permissions.canMoveTask).toBeFalse();
    expect(permissions.canReorderTasks).toBeFalse();
    expect(permissions.canManageColumns).toBeFalse();
    expect(permissions.canManageMembers).toBeFalse();
  });

  it('grants read-only permissions to a pending invitee', () => {
    const permissions = getBoardPermissions('INVITED', false);

    expect(permissions.isEditable).toBeFalse();
    expect(permissions.canCreateTask).toBeFalse();
    expect(permissions.canEditTask).toBeFalse();
    expect(permissions.canManageColumns).toBeFalse();
    expect(permissions.canManageMembers).toBeFalse();
  });

  it('is read-only when there is no membership role', () => {
    const permissions = getBoardPermissions(null, false);

    expect(permissions.isEditable).toBeFalse();
    expect(permissions.canCreateTask).toBeFalse();
    expect(permissions.canManageMembers).toBeFalse();
  });

  it('exposes convenience constants', () => {
    expect(OWNER_PERMISSIONS.canManageMembers).toBeTrue();
    expect(READ_ONLY_PERMISSIONS.isEditable).toBeFalse();
  });
});