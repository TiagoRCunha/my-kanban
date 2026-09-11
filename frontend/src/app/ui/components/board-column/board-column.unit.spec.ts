import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BoardColumn } from './board-column';

describe('BoardColumn (unit)', () => {
  let fixture: ComponentFixture<BoardColumn>;
  let component: BoardColumn;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardColumn],
    }).compileComponents();

    fixture = TestBed.createComponent(BoardColumn);
    component = fixture.componentInstance;

    component.column = {
      id: 1,
      title: 'To Do',
      position: 0,
      pinned: false,
      archived: false,
      isDone: false,
    };

    component.tasks = [
      {
        id: 1,
        title: 'Implement board view',
        description: 'Initial implementation task',
        tagId: 2,
        tagName: 'Medium',
        tagColor: '#ed6c02',
        dueDate: '2026-07-28',
        estimatedHours: 3,
        position: 0,
        done: false,
        reportedById: 1,
        assigneeIds: [1],
      },
    ];

    component.dropListId = 'column-drop-list-1';
    component.connectedDropListIds = ['column-drop-list-1'];

    fixture.detectChanges();
  });

  it('emits trimmed title when renaming', () => {
    spyOn(component.renameColumn, 'emit');

    component.onToggleRename();
    component.renameTitle = '  Backlog  ';
    component.onRenameColumn();

    expect(component.renameColumn.emit).toHaveBeenCalledOnceWith('Backlog');
    expect(component.isRenaming).toBeFalse();
  });

  it('cancels rename when title is blank', () => {
    spyOn(component.renameColumn, 'emit');

    component.onToggleRename();
    component.renameTitle = '   ';
    component.onRenameColumn();

    expect(component.renameColumn.emit).not.toHaveBeenCalled();
    expect(component.renameTitle).toBe('To Do');
    expect(component.isRenaming).toBeFalse();
  });

  it('emits toggle pin event', () => {
    spyOn(component.togglePin, 'emit');

    component.onTogglePin();

    expect(component.togglePin.emit).toHaveBeenCalled();
  });
});
