import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShareDialog } from './share-dialog';
import { BOARD_MEMBER_REPOSITORY } from '../../../infrastructure/di/repository-tokens';
import type { BoardMemberRepository } from '../../../domain/board/ports/board-member-repository.port';
import { BoardMember } from '../../../domain/board/entities/board-member.entity';

describe('ShareDialog', () => {
  let fixture: ComponentFixture<ShareDialog>;
  let component: ShareDialog;
  let memberRepositorySpy: jasmine.SpyObj<BoardMemberRepository>;

  const memberSnapshot = (id: number, email: string, fullName: string) =>
    BoardMember.fromSnapshot({
      id,
      boardId: 10,
      userId: id,
      email,
      fullName,
      role: 'GUEST',
    });

  beforeEach(async () => {
    memberRepositorySpy = jasmine.createSpyObj('BoardMemberRepository', [
      'listMembers',
      'inviteMember',
      'updateMemberRole',
      'removeMember',
    ]);
    memberRepositorySpy.listMembers.and.resolveTo([
      memberSnapshot(2, 'invited@example.com', 'Invited User'),
    ]);
    memberRepositorySpy.inviteMember.and.resolveTo(
      memberSnapshot(3, 'new@example.com', 'New User'),
    );
    memberRepositorySpy.updateMemberRole.and.resolveTo(
      memberSnapshot(2, 'invited@example.com', 'Invited User'),
    );
    memberRepositorySpy.removeMember.and.resolveTo();

    await TestBed.configureTestingModule({
      imports: [ShareDialog],
      providers: [
        { provide: BOARD_MEMBER_REPOSITORY, useValue: memberRepositorySpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ShareDialog);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('boardId', 10);
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('loads members when opened', () => {
    expect(memberRepositorySpy.listMembers).toHaveBeenCalledWith(10);
    expect(component.members).toHaveSize(1);
    expect(component.members[0].email).toBe('invited@example.com');
  });

  it('invites a member successfully and reloads the list', async () => {
    component.inviteEmail = ' new@example.com ';
    component.inviteRole = 'GUEST';

    await component.onInvite();

    expect(memberRepositorySpy.inviteMember).toHaveBeenCalledWith(10, {
      email: 'new@example.com',
      role: 'GUEST',
    });
    expect(component.successMessage).toBe('Invitation sent to new@example.com');
    expect(component.inviteEmail).toBe('');
    expect(component.inviteRole).toBe('GUEST');
    // Called once on open + once after invite
    expect(memberRepositorySpy.listMembers).toHaveBeenCalledTimes(2);
  });

  it('shows a friendly message when the invited user does not exist', async () => {
    memberRepositorySpy.inviteMember.and.rejectWith({ status: 404 });
    component.inviteEmail = 'unknown@example.com';

    await component.onInvite();

    expect(component.errorMessage).toBe('No user found with that email address.');
  });

  it('shows a friendly message when the user is already a member', async () => {
    memberRepositorySpy.inviteMember.and.rejectWith({ status: 409 });
    component.inviteEmail = 'existing@example.com';

    await component.onInvite();

    expect(component.errorMessage).toBe('This user is already a member of this board.');
  });

  it('shows a generic message on unexpected invite errors', async () => {
    memberRepositorySpy.inviteMember.and.rejectWith({ status: 500 });
    component.inviteEmail = 'any@example.com';

    await component.onInvite();

    expect(component.errorMessage).toBe('Failed to invite member. Please try again.');
  });

  it('updates a member role and reloads the list', async () => {
    const member = component.members[0];

    await component.onChangeRole(member, 'VIEW_ONLY');

    expect(memberRepositorySpy.updateMemberRole).toHaveBeenCalledWith(10, member.id, 'VIEW_ONLY');
    expect(memberRepositorySpy.listMembers).toHaveBeenCalledTimes(2);
  });

  it('removes a member and reloads the list', async () => {
    const member = component.members[0];

    await component.onRemoveMember(member);

    expect(memberRepositorySpy.removeMember).toHaveBeenCalledWith(10, member.id);
    expect(memberRepositorySpy.listMembers).toHaveBeenCalledTimes(2);
  });

  it('closes the dialog and resets its state', () => {
    component.errorMessage = 'Some error';
    component.successMessage = 'Some success';
    component.inviteEmail = 'x@example.com';
    spyOn(component.closed, 'emit');

    component.onClose();

    expect(component.open).toBeFalse();
    expect(component.inviteEmail).toBe('');
    expect(component.errorMessage).toBe('');
    expect(component.successMessage).toBe('');
    expect(component.closed.emit).toHaveBeenCalled();
  });
});