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
import com.tiagorcunha.mykanban.backend.common.application.exception.ResourceNotFoundException;
import com.tiagorcunha.mykanban.backend.user.application.port.out.UserRepositoryPort;
import com.tiagorcunha.mykanban.backend.user.domain.model.User;

@Service
public class BoardUseCaseHandler implements BoardUseCase {

  private final BoardRepositoryPort boardRepository;
  private final UserRepositoryPort userRepository;

  public BoardUseCaseHandler(BoardRepositoryPort boardRepository, UserRepositoryPort userRepository) {
    this.boardRepository = boardRepository;
    this.userRepository = userRepository;
  }

  @Override
  @Transactional(readOnly = true)
  public List<BoardResponse> findAll() {
    return boardRepository.findAll().stream()
        .map(BoardResponseMapper::toResponse)
        .toList();
  }

  @Override
  @Transactional(readOnly = true)
  public BoardResponse findById(Long id) {
    return BoardResponseMapper.toResponse(getExistingBoard(id));
  }

  @Override
  @Transactional
  public BoardResponse create(SaveBoardCommand command) {
    LocalDateTime now = LocalDateTime.now();
    Board board = new Board();
    board.setTitle(command.title());
    board.setDescription(command.description());
    board.setOwner(getExistingUser(command.ownerId()));
    board.setCreatedAt(now);
    board.setUpdatedAt(now);
    return BoardResponseMapper.toResponse(boardRepository.save(board));
  }

  @Override
  @Transactional
  public BoardResponse update(Long id, SaveBoardCommand command) {
    Board board = getExistingBoard(id);
    board.setTitle(command.title());
    board.setDescription(command.description());
    board.setOwner(getExistingUser(command.ownerId()));
    board.setUpdatedAt(LocalDateTime.now());
    return BoardResponseMapper.toResponse(boardRepository.save(board));
  }

  @Override
  @Transactional
  public void delete(Long id) {
    if (!boardRepository.existsById(id)) {
      throw new ResourceNotFoundException("Board not found");
    }
    boardRepository.deleteById(id);
  }

  private Board getExistingBoard(Long id) {
    return boardRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Board not found"));
  }

  private User getExistingUser(Long id) {
    return userRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("User not found"));
  }
}