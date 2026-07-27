package com.tiagorcunha.mykanban.backend.board.application.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.tiagorcunha.mykanban.backend.board.application.command.MoveTaskCommand;
import com.tiagorcunha.mykanban.backend.board.application.command.ReorderItemCommand;
import com.tiagorcunha.mykanban.backend.board.application.port.out.BoardColumnRepositoryPort;
import com.tiagorcunha.mykanban.backend.board.application.port.out.TaskRepositoryPort;
import com.tiagorcunha.mykanban.backend.board.domain.model.Board;
import com.tiagorcunha.mykanban.backend.board.domain.model.BoardColumn;
import com.tiagorcunha.mykanban.backend.board.domain.model.Task;
import com.tiagorcunha.mykanban.backend.common.application.exception.ResourceNotFoundException;
import com.tiagorcunha.mykanban.backend.common.infrastructure.security.AuthenticatedUserProvider;
import com.tiagorcunha.mykanban.backend.user.application.port.out.UserCustomTagRepositoryPort;
import com.tiagorcunha.mykanban.backend.user.application.port.out.UserRepositoryPort;
import com.tiagorcunha.mykanban.backend.user.domain.model.User;
import com.tiagorcunha.mykanban.backend.user.domain.model.UserRole;

@ExtendWith(MockitoExtension.class)
class TaskUseCaseHandlerTest {

  @Mock
  private TaskRepositoryPort taskRepository;
  @Mock
  private BoardColumnRepositoryPort boardColumnRepository;
  @Mock
  private UserRepositoryPort userRepository;
  @Mock
  private UserCustomTagRepositoryPort customTagRepository;
  @Mock
  private AuthenticatedUserProvider authenticatedUserProvider;
  @Mock
  private BoardAuthorizationService boardAuthorizationService;

  private TaskUseCaseHandler handler;

  private User currentUser;
  private Board board;
  private BoardColumn sourceColumn;
  private BoardColumn targetColumn;

  @BeforeEach
  void setUp() {
    handler = new TaskUseCaseHandler(
        taskRepository, boardColumnRepository, userRepository,
        customTagRepository, authenticatedUserProvider, boardAuthorizationService);

    currentUser = new User();
    currentUser.setId(1L);
    currentUser.setRole(UserRole.USER);

    board = new Board();
    board.setId(10L);
    board.setOwner(currentUser);

    sourceColumn = createColumn(1L, board);
    targetColumn = createColumn(2L, board);
  }

  @Test
  void reorder_updatesPositionsForAllTasksInColumn() {
    when(authenticatedUserProvider.getAuthenticatedUser()).thenReturn(currentUser);
    when(boardColumnRepository.findById(1L)).thenReturn(Optional.of(sourceColumn));

    Task task1 = createTask(10L, sourceColumn, 0);
    Task task2 = createTask(20L, sourceColumn, 1);
    Task task3 = createTask(30L, sourceColumn, 2);
    when(taskRepository.findByColumnId(1L)).thenReturn(List.of(task1, task2, task3));

    List<ReorderItemCommand> items = List.of(
        new ReorderItemCommand(30L, 0),
        new ReorderItemCommand(10L, 1),
        new ReorderItemCommand(20L, 2));

    handler.reorder(1L, items);

    verify(taskRepository, times(2)).saveAll(any());
    verify(taskRepository).flush();
    assertThat(task1.getPosition()).isEqualTo(1);
    assertThat(task2.getPosition()).isEqualTo(2);
    assertThat(task3.getPosition()).isEqualTo(0);
  }

  @Test
  void move_changesTaskColumnAndUpdatesPositions() {
    when(authenticatedUserProvider.getAuthenticatedUser()).thenReturn(currentUser);

    Task task = createTask(10L, sourceColumn, 1);
    when(taskRepository.findById(10L)).thenReturn(Optional.of(task));
    when(boardColumnRepository.findById(2L)).thenReturn(Optional.of(targetColumn));

    Task remainingTask = createTask(20L, sourceColumn, 0);
    when(taskRepository.findByColumnId(1L)).thenReturn(List.of(remainingTask));

    Task targetTask = createTask(30L, targetColumn, 0);
    when(taskRepository.findByColumnId(2L)).thenReturn(List.of(targetTask));

    MoveTaskCommand command = new MoveTaskCommand(
        2L,
        1,
        List.of(new ReorderItemCommand(20L, 0)),
        List.of(new ReorderItemCommand(30L, 0), new ReorderItemCommand(10L, 1)));

    handler.move(10L, command);

    assertThat(task.getBoardColumn()).isEqualTo(targetColumn);
    assertThat(task.getPosition()).isEqualTo(1);
    verify(taskRepository).save(task);
  }

  @Test
  void move_throwsWhenTargetColumnNotFound() {
    when(authenticatedUserProvider.getAuthenticatedUser()).thenReturn(currentUser);

    Task task = createTask(10L, sourceColumn, 0);
    when(taskRepository.findById(10L)).thenReturn(Optional.of(task));
    when(boardColumnRepository.findById(99L)).thenReturn(Optional.empty());

    MoveTaskCommand command = new MoveTaskCommand(99L, 0, null, List.of());

    assertThatThrownBy(() -> handler.move(10L, command))
        .isInstanceOf(ResourceNotFoundException.class);
  }

  @Test
  void move_throwsWhenTargetColumnDifferentBoard() {
    when(authenticatedUserProvider.getAuthenticatedUser()).thenReturn(currentUser);

    Task task = createTask(10L, sourceColumn, 0);
    when(taskRepository.findById(10L)).thenReturn(Optional.of(task));

    Board otherBoard = new Board();
    otherBoard.setId(99L);
    otherBoard.setOwner(currentUser);
    BoardColumn otherColumn = createColumn(3L, otherBoard);
    when(boardColumnRepository.findById(3L)).thenReturn(Optional.of(otherColumn));

    MoveTaskCommand command = new MoveTaskCommand(3L, 0, null, List.of());

    assertThatThrownBy(() -> handler.move(10L, command))
        .isInstanceOf(ResourceNotFoundException.class);
  }

  private BoardColumn createColumn(Long id, Board board) {
    BoardColumn col = new BoardColumn();
    col.setId(id);
    col.setPosition(0);
    col.setBoard(board);
    return col;
  }

  private Task createTask(Long id, BoardColumn column, Integer position) {
    Task task = new Task();
    task.setId(id);
    task.setBoardColumn(column);
    task.setPosition(position);
    task.setReportedBy(currentUser);
    return task;
  }
}
