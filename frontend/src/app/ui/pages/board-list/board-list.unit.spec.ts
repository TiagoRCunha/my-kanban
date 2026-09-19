import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BoardListPage } from './board-list';
import { HttpBoardRepository } from '../../../infrastructure/board/adapters/http-board.repository';
import { AuthService } from '../../../infrastructure/auth/auth.service';
import { ThemeService } from '../../../infrastructure/theme/theme.service';
import { Board } from '../../../domain/board/entities/board.entity';

describe('BoardListPage', () => {
  let fixture: ComponentFixture<BoardListPage>;
  let component: BoardListPage;
  let boardRepositorySpy: jasmine.SpyObj<HttpBoardRepository>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const boardSnapshot = (
    id: number,
    title: string,
    ownerId: number,
  ): Board =>
    Board.fromSnapshot({
      id,
      title,
      description: null,
      ownerId,
      createdAt: '2026-01-01T00:00:00',
      updatedAt: '2026-01-01T00:00:00',
    });

  beforeEach(async () => {
    boardRepositorySpy = jasmine.createSpyObj('HttpBoardRepository', [
      'findAll',
      'create',
      'update',
      'leaveBoard',
    ]);
    boardRepositorySpy.findAll.and.resolveTo([
      boardSnapshot(1, 'My Board', 1),
      boardSnapshot(2, 'Shared Board', 99),
    ]);
    boardRepositorySpy.leaveBoard.and.resolveTo();

    authServiceSpy = jasmine.createSpyObj('AuthService', [], {
      user: {
        id: 1,
        fullName: 'Test',
        email: 'test@test.com',
        avatarUrl: null,
        role: 'USER',
      },
    });
    const themeServiceSpy = jasmine.createSpyObj('ThemeService', [], { darkMode: false });

    await TestBed.configureTestingModule({
      imports: [BoardListPage],
      providers: [
        provideRouter([]),
        { provide: HttpBoardRepository, useValue: boardRepositorySpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ThemeService, useValue: themeServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BoardListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('loads the boards on init', () => {
    expect(boardRepositorySpy.findAll).toHaveBeenCalled();
    expect(component.boards).toHaveSize(2);
  });

  it('distinguishes owned boards from shared boards', () => {
    expect(component.isBoardOwner(component.boards[0])).toBeTrue();
    expect(component.isBoardOwner(component.boards[1])).toBeFalse();
  });

  it('renders an Edit button only for owned boards', () => {
    const editButtons = fixture.nativeElement.querySelectorAll(
      '.board-list-page__action-btn--edit',
    );
    const leaveButtons = fixture.nativeElement.querySelectorAll(
      '.board-list-page__action-btn--leave',
    );

    expect(editButtons.length).toBe(1);
    expect(leaveButtons.length).toBe(1);
  });

  it('exposes edit for owners and leave for guests', () => {
    expect(component.canEditBoard(component.boards[0])).toBeTrue();
    expect(component.canLeaveBoard(component.boards[0])).toBeFalse();
    expect(component.canEditBoard(component.boards[1])).toBeFalse();
    expect(component.canLeaveBoard(component.boards[1])).toBeTrue();
  });

  it('grants edit only to the owner, even for admin users', () => {
    authServiceSpy.user!.role = 'ADMIN';

    expect(component.canEditBoard(component.boards[0])).toBeTrue();
    expect(component.canEditBoard(component.boards[1])).toBeFalse();
    expect(component.canLeaveBoard(component.boards[1])).toBeTrue();
  });

  it('opens the creator dialog in edit mode for an owned board', () => {
    component.onEditBoard(component.boards[0]);

    expect(component['editingBoard']).toEqual({
      id: 1,
      title: 'My Board',
      description: '',
    });
    expect(component.boardCreatorDialog.isEditMode).toBeTrue();
  });

  it('updates a board and reloads the list', async () => {
    boardRepositorySpy.update.and.resolveTo(boardSnapshot(1, 'Renamed Board', 1));

    component.onEditBoard(component.boards[0]);
    await component.onSaveBoard({ title: 'Renamed Board', description: 'New description' });

    expect(boardRepositorySpy.update).toHaveBeenCalledWith(
      1,
      jasmine.objectContaining({ title: 'Renamed Board' }),
    );
    expect(boardRepositorySpy.findAll).toHaveBeenCalledTimes(2);
  });

  it('surfaces an error when editing a board fails', async () => {
    boardRepositorySpy.update.and.rejectWith({ status: 500 });

    component.onEditBoard(component.boards[0]);
    await component.onSaveBoard({ title: 'Renamed Board', description: '' });

    expect(component.errorMessage).toBe('Failed to update board. Please try again.');
  });

  it('leaves a shared board and reloads the list', async () => {
    await component.onLeaveBoard(2);

    expect(boardRepositorySpy.leaveBoard).toHaveBeenCalledWith(2);
    expect(boardRepositorySpy.findAll).toHaveBeenCalledTimes(2);
  });

  it('does not allow the owner to leave an owned board', async () => {
    await component.onLeaveBoard(1);

    expect(boardRepositorySpy.leaveBoard).not.toHaveBeenCalled();
  });

  it('surfaces an error when leaving a board fails', async () => {
    boardRepositorySpy.leaveBoard.and.rejectWith({ status: 500 });

    await component.onLeaveBoard(2);

    expect(component.errorMessage).toBe('Failed to leave board. Please try again.');
  });
});