import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { BoardColumn } from '../board-column';
import { BoardLayout } from './board-layout';
import { ColumnController } from '../column-controller';
import { HttpColumnRepository } from '../../../infrastructure/board/adapters/http-column.repository';
import { HttpTaskRepository } from '../../../infrastructure/board/adapters/task-http.repository';
import { HttpUserConfigRepository } from '../../../infrastructure/user-config/adapters/http-user-config.repository';
import { AuthService } from '../../../infrastructure/auth/auth.service';
import { Task } from '../../../domain/board/entities/task.entity';

describe('BoardLayout (integration)', () => {
  let fixture: ComponentFixture<BoardLayout>;
  let component: BoardLayout;

  beforeEach(async () => {
    const columnRepoSpy = jasmine.createSpyObj('HttpColumnRepository', ['findByBoardId', 'create', 'delete', 'reorder', 'update']);
    columnRepoSpy.create.and.callFake((input: { title: string; position: number; boardId: number }) =>
      Promise.resolve({
        id: 4,
        title: input.title,
        position: input.position,
      }),
    );
    columnRepoSpy.reorder.and.returnValue(Promise.resolve());
    columnRepoSpy.update.and.returnValue(Promise.resolve());
    const taskRepoSpy = jasmine.createSpyObj('HttpTaskRepository', ['findByColumnId', 'create', 'delete', 'reorder', 'moveTask', 'update']);
    taskRepoSpy.create.and.callFake((input: { title: string; description: string; tagId: number | null; dueDate: string | null; estimatedHours: number | null; position: number; assigneeIds: number[]; columnId: number }) =>
      Promise.resolve(
        Task.fromSnapshot({
          id: 10,
          title: input.title,
          description: input.description ?? '',
          tagId: input.tagId ?? null,
          tagName: 'Test Tag',
          tagColor: '#ff0000',
          dueDate: input.dueDate,
          estimatedHours: input.estimatedHours,
          position: input.position,
          columnId: input.columnId,
          reportedById: 1,
          assigneeIds: input.assigneeIds,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      ),
    );
    taskRepoSpy.update.and.callFake((_id: number, input: { title: string; description: string; tagId: number | null; dueDate: string | null; estimatedHours: number | null; position: number; assigneeIds: number[]; columnId: number }) =>
      Promise.resolve(
        Task.fromSnapshot({
          id: _id,
          title: input.title,
          description: input.description ?? '',
          tagId: input.tagId ?? null,
          tagName: '',
          tagColor: '',
          dueDate: input.dueDate,
          estimatedHours: input.estimatedHours,
          position: input.position,
          columnId: input.columnId,
          reportedById: 1,
          assigneeIds: input.assigneeIds,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      ),
    );
    taskRepoSpy.delete.and.returnValue(Promise.resolve());
    taskRepoSpy.reorder.and.returnValue(Promise.resolve());
    taskRepoSpy.moveTask.and.returnValue(Promise.resolve());
    const userConfigRepoSpy = jasmine.createSpyObj('HttpUserConfigRepository', ['getCustomTags']);
    userConfigRepoSpy.getCustomTags.and.resolveTo([
      { id: 1, name: 'Low', color: '#2e7d32' },
      { id: 2, name: 'Medium', color: '#ed6c02' },
      { id: 3, name: 'High', color: '#d32f2f' },
    ]);
    const authServiceSpy = jasmine.createSpyObj('AuthService', [], { user: { id: 1 } });

    await TestBed.configureTestingModule({
      imports: [FormsModule, BoardLayout],
      providers: [
        { provide: HttpColumnRepository, useValue: columnRepoSpy },
        { provide: HttpTaskRepository, useValue: taskRepoSpy },
        { provide: HttpUserConfigRepository, useValue: userConfigRepoSpy },
        { provide: AuthService, useValue: authServiceSpy },
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
            tagId: 3,
            tagName: 'High',
            tagColor: '#d32f2f',
            dueDate: '2026-07-20',
            estimatedHours: 4,
            position: 0,
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
            tagId: 2,
            tagName: 'Medium',
            tagColor: '#ed6c02',
            dueDate: '2026-07-22',
            estimatedHours: 6,
            position: 0,
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
            tagId: 1,
            tagName: 'Low',
            tagColor: '#2e7d32',
            dueDate: '2026-07-25',
            estimatedHours: 3,
            position: 0,
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
    // Click to enter editing mode
    const addButton = fixture.nativeElement.querySelector('[aria-label="Add a new column"]') as HTMLButtonElement;
    await addButton.click();
    fixture.detectChanges();
    await fixture.whenStable();

    // Verify the input appeared
    const input = fixture.nativeElement.querySelector('.column-controller__input') as HTMLInputElement;
    expect(input).toBeTruthy();

    // Set the title via the ColumnController component instance (reliable for testing)
    const controllerDebug = fixture.debugElement.query(By.directive(ColumnController));
    const controller = controllerDebug.componentInstance as ColumnController;
    controller.title = 'Review';
    fixture.detectChanges();

    // Confirm the column
    controller.confirmColumn();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.columns.length).toBe(4);
    expect(component.columns[3].title).toBe('Review');
  });

  it('updates parent state when a child emits rename event', async () => {
    const firstColumn = fixture.debugElement.queryAll(By.directive(BoardColumn))[0];
    const childComponent = firstColumn.componentInstance as BoardColumn;

    childComponent.renameColumn.emit('Backlog');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.columns[0].title).toBe('Backlog');
  });

  it('creates a task in the selected column', async () => {
    component.onCreateTask(component.columns[0].id);
    expect(component.taskEditor).toBeTruthy();

    component.onSaveTaskChanges({
      title: 'Created via modal',
      description: 'Task description',
      tagId: component.columns[0].tasks[0].tagId,
      tagName: component.columns[0].tasks[0].tagName,
      tagColor: component.columns[0].tasks[0].tagColor,
      dueDate: '2026-08-01',
      estimatedHours: 3,
      assigneeIdsText: '10,11',
    });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.columns[0].tasks.length).toBe(2);
    expect(component.columns[0].tasks[1].title).toBe('Created via modal');
  });

  it('deletes a task from the selected column', async () => {
    const firstColumn = fixture.debugElement.queryAll(By.directive(BoardColumn))[0];
    const childComponent = firstColumn.componentInstance as BoardColumn;
    const taskIdToDelete = component.columns[0].tasks[0].id;

    childComponent.deleteTask.emit(taskIdToDelete);
    await fixture.whenStable();
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

  it('updates task values when saving through task editor modal', async () => {
    const taskId = component.columns[0].tasks[0].id;
    component.onOpenTask(component.columns[0].id, taskId);

    if (!component.taskEditor) {
      fail('taskEditor should be initialized');
      return;
    }

    component.onSaveTaskChanges({
      title: 'Edited task title',
      description: 'Edited description',
      tagId: component.taskEditor.tagId,
      tagName: component.taskEditor.tagName,
      tagColor: component.taskEditor.tagColor,
      dueDate: '2026-07-30',
      estimatedHours: 5,
      assigneeIdsText: '5, 7',
    });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.taskEditor).toBeNull();
    expect(component.columns[0].tasks[0].title).toBe('Edited task title');
    expect(component.columns[0].tasks[0].description).toBe('Edited description');
    expect(component.columns[0].tasks[0].dueDate).toBe('2026-07-30');
    expect(component.columns[0].tasks[0].estimatedHours).toBe(5);
    expect(component.columns[0].tasks[0].assigneeIds).toEqual([5, 7]);
  });

  it('deletes current task from modal in edit mode', async () => {
    const taskId = component.columns[0].tasks[0].id;
    component.onOpenTask(component.columns[0].id, taskId);

    component.onDeleteTaskFromModal();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.columns[0].tasks.find((task) => task.id === taskId)).toBeUndefined();
    expect(component.taskEditor).toBeNull();
  });

  it('persists column reorder to backend when columns are reordered', () => {
    const columnRepoSpy = TestBed.inject(HttpColumnRepository) as jasmine.SpyObj<HttpColumnRepository>;

    const mockEvent = {
      previousIndex: 0,
      currentIndex: 2,
      previousContainer: { data: component.columns },
      container: { data: component.columns },
      item: { data: component.columns[0] },
    } as any;

    component.onColumnDrop(mockEvent);

    expect(columnRepoSpy.reorder).toHaveBeenCalledWith(1, [
      { id: 2, position: 0 },
      { id: 3, position: 1 },
      { id: 1, position: 2 },
    ]);
  });

  it('persists same-column task reorder to backend', () => {
    const taskRepoSpy = TestBed.inject(HttpTaskRepository) as jasmine.SpyObj<HttpTaskRepository>;
    const sourceColumn = component.columns[0];

    // Add a second task to make reordering meaningful
    sourceColumn.tasks.push({
      id: 10,
      title: 'Second task',
      description: '',
      tagId: null,
      tagName: '',
      tagColor: '',
      dueDate: '',
      estimatedHours: 0,
      position: 1,
      reportedById: 1,
      assigneeIds: [],
    });

    const container = { data: sourceColumn.tasks };
    const mockEvent = {
      previousIndex: 0,
      currentIndex: 1,
      previousContainer: container,
      container: container,
      item: { data: sourceColumn.tasks[0] },
    } as any;

    component.onTaskDrop(mockEvent);

    expect(taskRepoSpy.reorder).toHaveBeenCalledWith(sourceColumn.id, [
      { id: 10, position: 0 },
      { id: 1, position: 1 },
    ]);
  });

  it('persists cross-column task move to backend', () => {
    const taskRepoSpy = TestBed.inject(HttpTaskRepository) as jasmine.SpyObj<HttpTaskRepository>;
    const sourceColumn = component.columns[0];
    const targetColumn = component.columns[1];
    const movedTask = sourceColumn.tasks[0];

    const mockEvent = {
      previousIndex: 0,
      currentIndex: 0,
      previousContainer: { data: sourceColumn.tasks },
      container: { data: targetColumn.tasks },
      item: { data: movedTask },
    } as any;

    component.onTaskDrop(mockEvent);

    expect(taskRepoSpy.moveTask).toHaveBeenCalledWith(
      movedTask.id,
      sourceColumn.id,
      targetColumn.id,
      0,
      jasmine.any(Array),
      jasmine.any(Array),
    );
  });
});
