package com.tiagorcunha.mykanban.backend.board.application.usecase;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tiagorcunha.mykanban.backend.board.application.command.SaveBoardCommand;
import com.tiagorcunha.mykanban.backend.board.application.mapper.BoardResponseMapper;
import com.tiagorcunha.mykanban.backend.board.application.port.in.BoardUseCase;
import com.tiagorcunha.mykanban.backend.board.application.port.out.BoardColumnRepositoryPort;
import com.tiagorcunha.mykanban.backend.board.application.port.out.BoardRepositoryPort;
import com.tiagorcunha.mykanban.backend.board.application.response.BoardResponse;
import com.tiagorcunha.mykanban.backend.board.domain.model.Board;
import com.tiagorcunha.mykanban.backend.board.domain.model.BoardColumn;
import com.tiagorcunha.mykanban.backend.common.infrastructure.security.AuthenticatedUserProvider;
import com.tiagorcunha.mykanban.backend.common.application.exception.ResourceNotFoundException;
import com.tiagorcunha.mykanban.backend.user.application.port.out.UserStartupColumnRepositoryPort;
import com.tiagorcunha.mykanban.backend.user.domain.model.User;
import com.tiagorcunha.mykanban.backend.user.domain.model.UserStartupColumn;

@Service
public class BoardUseCaseHandler implements BoardUseCase {

  private final BoardRepositoryPort boardRepository;
  private final BoardColumnRepositoryPort boardColumnRepository;
  private final AuthenticatedUserProvider authenticatedUserProvider;
  private final BoardAuthorizationService boardAuthorizationService;
  private final UserStartupColumnRepositoryPort startupColumnRepository;

  public BoardUseCaseHandler(
      BoardRepositoryPort boardRepository,
      BoardColumnRepositoryPort boardColumnRepository,
      AuthenticatedUserProvider authenticatedUserProvider,
      BoardAuthorizationService boardAuthorizationService,
      UserStartupColumnRepositoryPort startupColumnRepository) {
    this.boardRepository = boardRepository;
    this.boardColumnRepository = boardColumnRepository;
    this.authenticatedUserProvider = authenticatedUserProvider;
    this.boardAuthorizationService = boardAuthorizationService;
    this.startupColumnRepository = startupColumnRepository;
  }

  @Override
  @Transactional(readOnly = true)
  public List<BoardResponse> findAll() {
    User currentUser = authenticatedUserProvider.getAuthenticatedUser();
    return boardRepository.findAll().stream()
      .filter(board -> boardAuthorizationService.canReadBoard(board, currentUser))
        .map(BoardResponseMapper::toResponse)
        .toList();
  }

  @Override
  @Transactional(readOnly = true)
  public BoardResponse findById(Long id) {
    User currentUser = authenticatedUserProvider.getAuthenticatedUser();
    Board board = getExistingBoard(id);
    boardAuthorizationService.assertCanReadBoard(board, currentUser);
    return BoardResponseMapper.toResponse(board);
  }

  @Override
  @Transactional
  public BoardResponse create(SaveBoardCommand command) {
    User currentUser = authenticatedUserProvider.getAuthenticatedUser();
    LocalDateTime now = LocalDateTime.now();
    Board board = new Board();
    board.setTitle(command.title());
    board.setDescription(command.description());
    board.setOwner(currentUser);
    board.setCreatedAt(now);
    board.setUpdatedAt(now);
    Board savedBoard = boardRepository.save(board);

    List<UserStartupColumn> startupColumns =
        startupColumnRepository.findByUserIdOrderByPositionAsc(currentUser.getId());

    for (UserStartupColumn sc : startupColumns) {
      BoardColumn column = new BoardColumn();
      column.setTitle(sc.getTitle());
      column.setPosition(sc.getPosition());
      column.setArchived("ARCHIVE".equals(sc.getType()));
      column.setIsDone("DONE".equals(sc.getType()));
      column.setBoard(savedBoard);
      column.setCreatedAt(now);
      boardColumnRepository.save(column);
    }

    return BoardResponseMapper.toResponse(savedBoard);
  }

  @Override
  @Transactional
  public BoardResponse update(Long id, SaveBoardCommand command) {
    User currentUser = authenticatedUserProvider.getAuthenticatedUser();
    Board board = getExistingBoard(id);
    boardAuthorizationService.assertCanManageBoard(board, currentUser);
    board.setTitle(command.title());
    board.setDescription(command.description());
    board.setUpdatedAt(LocalDateTime.now());
    return BoardResponseMapper.toResponse(boardRepository.save(board));
  }

  @Override
  @Transactional
  public void delete(Long id) {
    User currentUser = authenticatedUserProvider.getAuthenticatedUser();
    Board board = getExistingBoard(id);
    boardAuthorizationService.assertCanManageBoard(board, currentUser);
    boardRepository.deleteById(id);
  }

  private Board getExistingBoard(Long id) {
    return boardRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Board not found"));
  }
}