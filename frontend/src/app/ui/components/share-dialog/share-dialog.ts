import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AnimatedButton } from '../animated-button';
import { BoardMember, BoardMemberRole } from '../../../domain/board/entities/board-member.entity';
import { ListBoardMembersUseCase } from '../../../domain/board/use-cases/board-member/list-board-members.use-case';
import { InviteBoardMemberUseCase } from '../../../domain/board/use-cases/board-member/invite-board-member.use-case';
import { UpdateBoardMemberRoleUseCase } from '../../../domain/board/use-cases/board-member/update-board-member-role.use-case';
import { RemoveBoardMemberUseCase } from '../../../domain/board/use-cases/board-member/remove-board-member.use-case';
import { HttpBoardMemberRepository } from '../../../infrastructure/board/adapters/http-board-member.repository';

@Component({
  selector: 'app-share-dialog',
  imports: [FormsModule, AnimatedButton],
  templateUrl: './share-dialog.html',
  styleUrl: './share-dialog.scss',
})
export class ShareDialog implements OnChanges {
  @Input() boardId = 0;
  @Input() open = false;
  @Output() closed = new EventEmitter<void>();

  private readonly memberRepository = inject(HttpBoardMemberRepository);
  private readonly listMembersUseCase = new ListBoardMembersUseCase(this.memberRepository);
  private readonly inviteMemberUseCase = new InviteBoardMemberUseCase(this.memberRepository);
  private readonly updateRoleUseCase = new UpdateBoardMemberRoleUseCase(this.memberRepository);
  private readonly removeMemberUseCase = new RemoveBoardMemberUseCase(this.memberRepository);

  members: BoardMember[] = [];
  inviteEmail = '';
  inviteRole: BoardMemberRole = 'GUEST';
  isLoading = false;
  isInviting = false;
  errorMessage = '';
  successMessage = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open'] && this.open && this.boardId) {
      this.loadMembers();
    }
  }

  get isVisible(): boolean {
    return this.open;
  }

  get canInvite(): boolean {
    return this.inviteEmail.trim().length > 0 && !this.isInviting;
  }

  async loadMembers(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      this.members = await this.listMembersUseCase.execute(this.boardId);
    } catch {
      this.errorMessage = 'Failed to load board members.';
    } finally {
      this.isLoading = false;
    }
  }

  async onInvite(): Promise<void> {
    if (!this.canInvite) {
      return;
    }

    this.isInviting = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      await this.inviteMemberUseCase.execute(this.boardId, {
        email: this.inviteEmail.trim(),
        role: this.inviteRole,
      });

      this.successMessage = `Invitation sent to ${this.inviteEmail.trim()}`;
      this.inviteEmail = '';
      this.inviteRole = 'GUEST';
      await this.loadMembers();
    } catch (error: any) {
      if (error?.status === 404) {
        this.errorMessage = 'No user found with that email address.';
      } else if (error?.status === 409) {
        this.errorMessage = 'This user is already a member of this board.';
      } else {
        this.errorMessage = 'Failed to invite member. Please try again.';
      }
    } finally {
      this.isInviting = false;
    }
  }

  async onChangeRole(member: BoardMember, newRole: BoardMemberRole): Promise<void> {
    try {
      await this.updateRoleUseCase.execute(this.boardId, member.id, newRole);
      await this.loadMembers();
    } catch {
      this.errorMessage = 'Failed to update member role.';
    }
  }

  async onRemoveMember(member: BoardMember): Promise<void> {
    try {
      await this.removeMemberUseCase.execute(this.boardId, member.id);
      await this.loadMembers();
    } catch {
      this.errorMessage = 'Failed to remove member.';
    }
  }

  onClose(): void {
    this.open = false;
    this.inviteEmail = '';
    this.inviteRole = 'GUEST';
    this.errorMessage = '';
    this.successMessage = '';
    this.closed.emit();
  }
}