package com.tiagorcunha.mykanban.backend.board.application.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.tiagorcunha.mykanban.backend.board.application.command.ReorderItemCommand;
import com.tiagorcunha.mykanban.backend.board.application.command.SaveBoardColumnCommand;
import com.tiagorcunha.mykanban.backend.board.application.port.out.BoardColumnRepositoryPort;
import com.tiagorcunha.mykanban.backend.board.application.port.out.BoardRepositoryPort;
import com.tiagorcunha.mykanban.backend.board.domain.model.Board;
import com.tiagorcunha.mykanban.backend.board.domain.model.BoardColumn;
import com.tiagorcunha.mykanban.backend.common.application.exception.ResourceNotFoundException;
import com.tiagorcunha.mykanban.backend.common.infrastructure.security.AuthenticatedUserProvider;
import com.tiagorcunha.mykanban.backend.user.domain.model.User;
import com.tiagorcunha.mykanban.backend.user.domain.model.UserRole;

@ExtendWith(MockitoExtension.class)
class BoardColumnUseCaseHandlerTest {

  @Mock
  private BoardColumnRepositoryPort boardColumnRepository;
  @Mock
  private BoardRepositoryPort boardRepository;
  @Mock
  private AuthenticatedUserProvider authenticatedUserProvider;
  @Mock
  private BoardAuthorizationService boardAuthorizationService;

  private BoardColumnUseCaseHandler handler;

  private User currentUser;
  private Board board;

  @BeforeEach
  void setUp() {
    handler = new BoardColumnUseCaseHandler(
        boardColumnRepository, boardRepository, authenticatedUserProvider, boardAuthorizationService);

    currentUser = new User();
    currentUser.setId(1L);
    currentUser.setRole(UserRole.USER);

    board = new Board();
    board.setId(10L);
    board.setOwner(currentUser);
  }

  @Test
  void reorder_updatesPositionsForAllColumns() {
    when(authenticatedUserProvider.getAuthenticatedUser()).thenReturn(currentUser);
    when(boardRepository.findById(10L)).thenReturn(Optional.of(board));

    BoardColumn col1 = createColumn(1L, 0);
    BoardColumn col2 = createColumn(2L, 1);
    BoardColumn col3 = createColumn(3L, 2);
    when(boardColumnRepository.findByBoardId(10L)).thenReturn(List.of(col1, col2, col3));

    List<ReorderItemCommand> items = List.of(
        new ReorderItemCommand(3L, 0),
        new ReorderItemCommand(1L, 1),
        new ReorderItemCommand(2L, 2));

    handler.reorder(10L, items);

    verify(boardColumnRepository, times(2)).saveAll(any());
    verify(boardColumnRepository).flush();
    assertThat(col1.getPosition()).isEqualTo(1);
    assertThat(col2.getPosition()).isEqualTo(2);
    assertThat(col3.getPosition()).isEqualTo(0);
  }

  @Test
  void reorder_throwsWhenColumnNotFoundInBoard() {
    when(authenticatedUserProvider.getAuthenticatedUser()).thenReturn(currentUser);
    when(boardRepository.findById(10L)).thenReturn(Optional.of(board));

    BoardColumn col1 = createColumn(1L, 0);
    when(boardColumnRepository.findByBoardId(10L)).thenReturn(List.of(col1));

    List<ReorderItemCommand> items = List.of(
        new ReorderItemCommand(99L, 0));

    assertThatThrownBy(() -> handler.reorder(10L, items))
        .isInstanceOf(ResourceNotFoundException.class);
  }

  @Test
  void create_setsPositionToNextAvailable() {
    when(authenticatedUserProvider.getAuthenticatedUser()).thenReturn(currentUser);
    when(boardRepository.findById(10L)).thenReturn(Optional.of(board));

    BoardColumn col1 = createColumn(1L, 0);
    BoardColumn col2 = createColumn(2L, 1);
    when(boardColumnRepository.findByBoardId(10L)).thenReturn(List.of(col1, col2));
    when(boardColumnRepository.save(any(BoardColumn.class))).thenAnswer(invocation -> invocation.getArgument(0));

    SaveBoardColumnCommand command = new SaveBoardColumnCommand("New Column", 99);
    handler.create(10L, command);

    ArgumentCaptor<BoardColumn> captor = ArgumentCaptor.forClass(BoardColumn.class);
    verify(boardColumnRepository).save(captor.capture());
    assertThat(captor.getValue().getPosition()).isEqualTo(2);
    assertThat(captor.getValue().getTitle()).isEqualTo("New Column");
  }

  @Test
  void create_setsPositionToZeroWhenNoColumnsExist() {
    when(authenticatedUserProvider.getAuthenticatedUser()).thenReturn(currentUser);
    when(boardRepository.findById(10L)).thenReturn(Optional.of(board));
    when(boardColumnRepository.findByBoardId(10L)).thenReturn(List.of());
    when(boardColumnRepository.save(any(BoardColumn.class))).thenAnswer(invocation -> invocation.getArgument(0));

    SaveBoardColumnCommand command = new SaveBoardColumnCommand("First Column", 5);
    handler.create(10L, command);

    ArgumentCaptor<BoardColumn> captor = ArgumentCaptor.forClass(BoardColumn.class);
    verify(boardColumnRepository).save(captor.capture());
    assertThat(captor.getValue().getPosition()).isEqualTo(0);
  }

  @Test
  void reorder_throwsWhenBoardNotFound() {
    when(authenticatedUserProvider.getAuthenticatedUser()).thenReturn(currentUser);
    when(boardRepository.findById(10L)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> handler.reorder(10L, List.of()))
        .isInstanceOf(ResourceNotFoundException.class);
  }

  @Test
  void create_throwsWhenBoardNotFound() {
    when(authenticatedUserProvider.getAuthenticatedUser()).thenReturn(currentUser);
    when(boardRepository.findById(10L)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> handler.create(10L, new SaveBoardColumnCommand("Col", 0)))
        .isInstanceOf(ResourceNotFoundException.class);
  }

  private BoardColumn createColumn(Long id, Integer position) {
    BoardColumn col = new BoardColumn();
    col.setId(id);
    col.setPosition(position);
    col.setBoard(board);
    return col;
  }
}
