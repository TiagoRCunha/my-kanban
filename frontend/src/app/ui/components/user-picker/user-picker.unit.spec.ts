import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserPicker } from './user-picker';
import { HttpUserRepository } from '../../../infrastructure/users';
import { User } from '../../../domain/users';

describe('UserPicker', () => {
  let fixture: ComponentFixture<UserPicker>;
  let component: UserPicker;
  let userRepositorySpy: jasmine.SpyObj<HttpUserRepository>;

  const buildUser = (id: number, fullName: string, email: string): User =>
    User.fromSnapshot({
      id,
      fullName,
      email,
      avatarUrl: null,
      role: 'USER',
      createdAt: '2026-01-01T00:00:00',
      updatedAt: '2026-01-01T00:00:00',
    });

  beforeEach(async () => {
    userRepositorySpy = jasmine.createSpyObj('HttpUserRepository', ['findAll']);
    userRepositorySpy.findAll.and.resolveTo([
      buildUser(1, 'Ana Souza', 'ana@example.com'),
      buildUser(2, 'Bruno Lima', 'bruno@example.com'),
    ]);

    await TestBed.configureTestingModule({
      imports: [UserPicker],
      providers: [{ provide: HttpUserRepository, useValue: userRepositorySpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(UserPicker);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('selectedIds', [1]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('loads users on init', () => {
    expect(userRepositorySpy.findAll).toHaveBeenCalled();
    expect(component.users).toHaveSize(2);
  });

  it('surfaces an error when loading users fails', async () => {
    userRepositorySpy.findAll.and.rejectWith({ status: 500 });
    await component.loadUsers();

    expect(component.errorMessage).toBe('Failed to load users.');
  });

  it('derives the selected users from the selectedIds input', () => {
    expect(component.selectedUsers.map((user) => user.id)).toEqual([1]);
  });

  it('emits the added id when toggling an unselected user', () => {
    spyOn(component.selectedIdsChange, 'emit');
    const target = component.users[1];

    component.toggleUser(target);

    expect(component.selectedIdsChange.emit).toHaveBeenCalledWith([1, 2]);
  });

  it('emits the remaining ids when toggling a selected user', () => {
    spyOn(component.selectedIdsChange, 'emit');
    const target = component.users[0];

    component.toggleUser(target);

    expect(component.selectedIdsChange.emit).toHaveBeenCalledWith([]);
  });

  it('knows whether a user is selected', () => {
    expect(component.isSelected(1)).toBeTrue();
    expect(component.isSelected(2)).toBeFalse();
  });

  it('filters users by name', () => {
    component.searchText = 'bruno';

    expect(component.filteredUsers.map((user) => user.id)).toEqual([2]);
  });

  it('filters users by email', () => {
    component.searchText = 'ana@example.com';

    expect(component.filteredUsers.map((user) => user.id)).toEqual([1]);
  });

  it('returns all users when search text is blank', () => {
    component.searchText = '   ';

    expect(component.filteredUsers).toHaveSize(2);
  });

  it('emits the remaining ids when removing a chip', () => {
    spyOn(component.selectedIdsChange, 'emit');

    component.removeUser(1);

    expect(component.selectedIdsChange.emit).toHaveBeenCalledWith([]);
  });
});