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
      'leaveBoard',
    ]);
    boardRepositorySpy.findAll.and.resolveTo([
      boardSnapshot(1, 'My Board', 1),
      boardSnapshot(2, 'Shared Board', 99),
    ]);
    boardRepositorySpy.leaveBoard.and.resolveTo();

    const authServiceSpy = jasmine.createSpyObj('AuthService', [], { user: { id: 1 } });
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

  it('renders a Leave button only for non-owned boards', () => {
    const leaveButtons = fixture.nativeElement.querySelectorAll('.board-list-page__leave-btn');
    expect(leaveButtons.length).toBe(1);
  });

  it('leaves a shared board and reloads the list', async () => {
    component.onLeaveBoard(2);
    await fixture.whenStable();

    expect(boardRepositorySpy.leaveBoard).toHaveBeenCalledWith(2);
    expect(boardRepositorySpy.findAll).toHaveBeenCalledTimes(2);
  });

  it('surfaces an error when leaving a board fails', async () => {
    boardRepositorySpy.leaveBoard.and.rejectWith({ status: 500 });

    await component.onLeaveBoard(2);

    expect(component.errorMessage).toBe('Failed to leave board. Please try again.');
  });
});