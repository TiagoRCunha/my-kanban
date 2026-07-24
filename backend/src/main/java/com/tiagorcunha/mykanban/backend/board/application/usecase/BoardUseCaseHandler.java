package com.tiagorcunha.mykanban.backend.board.application.usecase;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tiagorcunha.mykanban.backend.board.application.command.SaveBoardCommand;
import com.tiagorcunha.mykanban.backend.board.application.mapper.BoardResponseMapper;
import com.tiagorcunha.mykanban.backend.board.application.port.in.BoardUseCase;
import com.tiagorcunha.mykanban.backend.board.application.port.out.BoardRepositoryPort;
import com.tiagorcunha.mykanban.backend.board.application.response.BoardResponse;
import com.tiagorcunha.mykanban.backend.board.domain.model.Board;
import com.tiagorcunha.mykanban.backend.common.infrastructure.security.AuthenticatedUserProvider;
import com.tiagorcunha.mykanban.backend.common.application.exception.ResourceNotFoundException;
import com.tiagorcunha.mykanban.backend.user.domain.model.User;

@Service
public class BoardUseCaseHandler implements BoardUseCase {

  private final BoardRepositoryPort boardRepository;
  private final AuthenticatedUserProvider authenticatedUserProvider;
  private final BoardAuthorizationService boardAuthorizationService;

  public BoardUseCaseHandler(
      BoardRepositoryPort boardRepository,
      AuthenticatedUserProvider authenticatedUserProvider,
      BoardAuthorizationService boardAuthorizationService) {
    this.boardRepository = boardRepository;
    this.authenticatedUserProvider = authenticatedUserProvider;
    this.boardAuthorizationService = boardAuthorizationService;
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
    return BoardResponseMapper.toResponse(boardRepository.save(board));
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