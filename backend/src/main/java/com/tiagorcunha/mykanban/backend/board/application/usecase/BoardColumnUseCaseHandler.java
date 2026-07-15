package com.tiagorcunha.mykanban.backend.board.application.usecase;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tiagorcunha.mykanban.backend.board.application.command.SaveBoardColumnCommand;
import com.tiagorcunha.mykanban.backend.board.application.mapper.BoardColumnResponseMapper;
import com.tiagorcunha.mykanban.backend.board.application.port.in.BoardColumnUseCase;
import com.tiagorcunha.mykanban.backend.board.application.port.out.BoardColumnRepositoryPort;
import com.tiagorcunha.mykanban.backend.board.application.port.out.BoardRepositoryPort;
import com.tiagorcunha.mykanban.backend.board.application.response.BoardColumnResponse;
import com.tiagorcunha.mykanban.backend.board.domain.model.Board;
import com.tiagorcunha.mykanban.backend.board.domain.model.BoardColumn;
import com.tiagorcunha.mykanban.backend.common.application.exception.ConflictException;
import com.tiagorcunha.mykanban.backend.common.application.exception.ResourceNotFoundException;
import com.tiagorcunha.mykanban.backend.common.infrastructure.security.AuthenticatedUserProvider;
import com.tiagorcunha.mykanban.backend.user.domain.model.User;

@Service
public class BoardColumnUseCaseHandler implements BoardColumnUseCase {

  private final BoardColumnRepositoryPort boardColumnRepository;
  private final BoardRepositoryPort boardRepository;
  private final AuthenticatedUserProvider authenticatedUserProvider;
  private final BoardAuthorizationService boardAuthorizationService;

  public BoardColumnUseCaseHandler(
      BoardColumnRepositoryPort boardColumnRepository,
      BoardRepositoryPort boardRepository,
      AuthenticatedUserProvider authenticatedUserProvider,
      BoardAuthorizationService boardAuthorizationService) {
    this.boardColumnRepository = boardColumnRepository;
    this.boardRepository = boardRepository;
    this.authenticatedUserProvider = authenticatedUserProvider;
    this.boardAuthorizationService = boardAuthorizationService;
  }

  @Override
  @Transactional(readOnly = true)
  public List<BoardColumnResponse> findByBoardId(Long boardId) {
    User currentUser = authenticatedUserProvider.getAuthenticatedUser();
    Board board = requireBoard(boardId);
    boardAuthorizationService.assertCanReadBoard(board, currentUser);
    return boardColumnRepository.findByBoardId(boardId).stream()
        .map(BoardColumnResponseMapper::toResponse)
        .toList();
  }

  @Override
  @Transactional
  public BoardColumnResponse create(Long boardId, SaveBoardColumnCommand command) {
    User currentUser = authenticatedUserProvider.getAuthenticatedUser();
    Board board = requireBoard(boardId);
    boardAuthorizationService.assertCanManageColumn(board, currentUser);
    if (boardColumnRepository.existsByBoardIdAndPosition(boardId, command.position())) {
      throw new ConflictException("Board column position already in use");
    }

    BoardColumn boardColumn = new BoardColumn();
    boardColumn.setTitle(command.title());
    boardColumn.setPosition(command.position());
    boardColumn.setBoard(board);
    boardColumn.setCreatedAt(LocalDateTime.now());
    return BoardColumnResponseMapper.toResponse(boardColumnRepository.save(boardColumn));
  }

  @Override
  @Transactional
  public BoardColumnResponse update(Long boardId, Long columnId, SaveBoardColumnCommand command) {
    User currentUser = authenticatedUserProvider.getAuthenticatedUser();
    BoardColumn boardColumn = getExistingBoardColumn(boardId, columnId);
    boardAuthorizationService.assertCanManageColumn(boardColumn.getBoard(), currentUser);
    if (boardColumnRepository.existsByBoardIdAndPositionAndIdNot(boardId, command.position(), columnId)) {
      throw new ConflictException("Board column position already in use");
    }

    boardColumn.setTitle(command.title());
    boardColumn.setPosition(command.position());
    return BoardColumnResponseMapper.toResponse(boardColumnRepository.save(boardColumn));
  }

  @Override
  @Transactional
  public void delete(Long boardId, Long columnId) {
    User currentUser = authenticatedUserProvider.getAuthenticatedUser();
    BoardColumn boardColumn = getExistingBoardColumn(boardId, columnId);
    boardAuthorizationService.assertCanManageColumn(boardColumn.getBoard(), currentUser);
    boardColumnRepository.delete(boardColumn);
  }

  private Board requireBoard(Long boardId) {
    return boardRepository.findById(boardId)
        .orElseThrow(() -> new ResourceNotFoundException("Board not found"));
  }

  private BoardColumn getExistingBoardColumn(Long boardId, Long columnId) {
    BoardColumn boardColumn = boardColumnRepository.findById(columnId)
        .orElseThrow(() -> new ResourceNotFoundException("Board column not found"));
    if (!boardColumn.getBoard().getId().equals(boardId)) {
      throw new ResourceNotFoundException("Board column not found");
    }
    return boardColumn;
  }
}