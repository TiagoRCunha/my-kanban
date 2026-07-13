import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BoardColumn } from '../board-column';
import { BoardLayout } from './board-layout';

describe('BoardLayout (integration)', () => {
  let fixture: ComponentFixture<BoardLayout>;
  let component: BoardLayout;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardLayout],
    }).compileComponents();

    fixture = TestBed.createComponent(BoardLayout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders three initial columns', () => {
    const columns = fixture.debugElement.queryAll(By.directive(BoardColumn));

    expect(columns.length).toBe(3);
  });

  it('adds a new column through the controller button', () => {
    const addButton = fixture.nativeElement.querySelector('[aria-label="Add a new column"]') as HTMLButtonElement;

    addButton.click();
    fixture.detectChanges();

    expect(component.columns.length).toBe(4);
    expect(component.columns[3].title).toBe('New Column 4');
  });

  it('updates parent state when a child emits rename event', () => {
    const firstColumn = fixture.debugElement.queryAll(By.directive(BoardColumn))[0];
    const childComponent = firstColumn.componentInstance as BoardColumn;

    childComponent.renameColumn.emit('Backlog');
    fixture.detectChanges();

    expect(component.columns[0].title).toBe('Backlog');
  });

  it('creates a task in the selected column', () => {
    const firstColumn = fixture.debugElement.queryAll(By.directive(BoardColumn))[0];
    const childComponent = firstColumn.componentInstance as BoardColumn;

    childComponent.createTask.emit(component.columns[0].id);
    fixture.detectChanges();

    expect(component.columns[0].tasks.length).toBe(2);
    expect(component.columns[0].tasks[1].title).toBe('New Task 4');
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
});
