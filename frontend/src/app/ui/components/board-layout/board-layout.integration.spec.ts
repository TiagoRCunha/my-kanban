import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BoardColumn } from '../board-column';
import { BoardLayout } from './board-layout';
import { HttpColumnRepository } from '../../../infrastructure/board/adapters/http-column.repository';
import { HttpTaskRepository } from '../../../infrastructure/board/adapters/task-http.repository';
import { TaskPriority } from '../../../domain/board/entities/task.entity';

describe('BoardLayout (integration)', () => {
  let fixture: ComponentFixture<BoardLayout>;
  let component: BoardLayout;

  beforeEach(async () => {
    const columnRepoSpy = jasmine.createSpyObj('HttpColumnRepository', ['findByBoardId', 'create', 'delete']);
    columnRepoSpy.create.and.resolveTo({
      id: 4,
      title: 'New Column',
      position: 4,
    });
    const taskRepoSpy = jasmine.createSpyObj('HttpTaskRepository', ['findByColumnId', 'create', 'delete']);

    await TestBed.configureTestingModule({
      imports: [BoardLayout],
      providers: [
        { provide: HttpColumnRepository, useValue: columnRepoSpy },
        { provide: HttpTaskRepository, useValue: taskRepoSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BoardLayout);
    component = fixture.componentInstance;
    component.boardId = 1;

    // Bypass async loading by setting data directly (matches the original test pattern)
    component.columns = [
      {
        id: 1,
        title: 'To Do',
        position: 1,
        pinned: false,
        tasks: [
          {
            id: 1,
            title: 'Design the navbar layout',
            description: 'Prepare the first static navbar for board navigation.',
            priority: TaskPriority.HIGH,
            dueDate: '2026-07-20',
            estimatedHours: 4,
            reportedById: 1,
            assigneeIds: [1, 2],
          },
        ],
      },
      {
        id: 2,
        title: 'In Progress',
        position: 2,
        pinned: false,
        tasks: [
          {
            id: 2,
            title: 'Implement drag and drop',
            description: 'Enable drag and drop across columns.',
            priority: TaskPriority.MEDIUM,
            dueDate: '2026-07-22',
            estimatedHours: 6,
            reportedById: 1,
            assigneeIds: [1],
          },
        ],
      },
      {
        id: 3,
        title: 'Done',
        position: 3,
        pinned: false,
        tasks: [
          {
            id: 3,
            title: 'Scaffold board page layout',
            description: 'Create board wrapper and mocked first column.',
            priority: TaskPriority.LOW,
            dueDate: '2026-07-25',
            estimatedHours: 3,
            reportedById: 1,
            assigneeIds: [],
          },
        ],
      },
    ];
    component.isLoading = false;

    fixture.detectChanges();
  });

  it('renders three initial columns', () => {
    const columns = fixture.debugElement.queryAll(By.directive(BoardColumn));

    expect(columns.length).toBe(3);
  });

  it('adds a new column through the controller button', async () => {
    const addButton = fixture.nativeElement.querySelector('[aria-label="Add a new column"]') as HTMLButtonElement;

    await addButton.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.columns.length).toBe(4);
  });

  it('updates parent state when a child emits rename event', () => {
    const firstColumn = fixture.debugElement.queryAll(By.directive(BoardColumn))[0];
    const childComponent = firstColumn.componentInstance as BoardColumn;

    childComponent.renameColumn.emit('Backlog');
    fixture.detectChanges();

    expect(component.columns[0].title).toBe('Backlog');
  });

  it('creates a task in the selected column', () => {
    component.onCreateTask(component.columns[0].id);
    expect(component.taskEditor).toBeTruthy();

    component.onSaveTaskChanges({
      title: 'Created via modal',
      description: 'Task description',
      priority: component.columns[0].tasks[0].priority,
      dueDate: '2026-08-01',
      estimatedHours: 3,
      assigneeIdsText: '10,11',
    });
    fixture.detectChanges();

    expect(component.columns[0].tasks.length).toBe(2);
    expect(component.columns[0].tasks[1].title).toBe('Created via modal');
  });

  it('deletes a task from the selected column', () => {
    const firstColumn = fixture.debugElement.queryAll(By.directive(BoardColumn))[0];
    const childComponent = firstColumn.componentInstance as BoardColumn;
    const taskIdToDelete = component.columns[0].tasks[0].id;

    childComponent.deleteTask.emit(taskIdToDelete);
    fixture.detectChanges();

    expect(component.columns[0].tasks.find((task) => task.id === taskIdToDelete)).toBeUndefined();
    expect(component.columns[0].tasks.length).toBe(0);
  });

  it('opens task editor modal when task card emits open event', () => {
    const firstColumn = fixture.debugElement.queryAll(By.directive(BoardColumn))[0];
    const childComponent = firstColumn.componentInstance as BoardColumn;
    const taskId = component.columns[0].tasks[0].id;

    childComponent.openTask.emit(taskId);
    fixture.detectChanges();

    expect(component.taskEditor).toBeTruthy();
    expect(component.taskEditor?.taskId).toBe(taskId);
    expect(component.taskEditor?.title).toBe(component.columns[0].tasks[0].title);
  });

  it('updates task values when saving through task editor modal', () => {
    const taskId = component.columns[0].tasks[0].id;
    component.onOpenTask(component.columns[0].id, taskId);

    if (!component.taskEditor) {
      fail('taskEditor should be initialized');
      return;
    }

    component.onSaveTaskChanges({
      title: 'Edited task title',
      description: 'Edited description',
      priority: component.taskEditor.priority,
      dueDate: '2026-07-30',
      estimatedHours: 5,
      assigneeIdsText: '5, 7',
    });
    fixture.detectChanges();

    expect(component.taskEditor).toBeNull();
    expect(component.columns[0].tasks[0].title).toBe('Edited task title');
    expect(component.columns[0].tasks[0].description).toBe('Edited description');
    expect(component.columns[0].tasks[0].dueDate).toBe('2026-07-30');
    expect(component.columns[0].tasks[0].estimatedHours).toBe(5);
    expect(component.columns[0].tasks[0].assigneeIds).toEqual([5, 7]);
  });

  it('deletes current task from modal in edit mode', () => {
    const taskId = component.columns[0].tasks[0].id;
    component.onOpenTask(component.columns[0].id, taskId);

    component.onDeleteTaskFromModal();
    fixture.detectChanges();

    expect(component.columns[0].tasks.find((task) => task.id === taskId)).toBeUndefined();
    expect(component.taskEditor).toBeNull();
  });
});
