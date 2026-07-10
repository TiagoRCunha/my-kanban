package com.tiagorcunha.mykanban.backend.board.infrastructure.persistence;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Component;

import com.tiagorcunha.mykanban.backend.board.application.port.out.BoardColumnRepositoryPort;
import com.tiagorcunha.mykanban.backend.board.domain.model.BoardColumn;

@Component
public class BoardColumnRepositoryAdapter implements BoardColumnRepositoryPort {

  private final SpringDataBoardColumnRepository repository;

  public BoardColumnRepositoryAdapter(SpringDataBoardColumnRepository repository) {
    this.repository = repository;
  }

  @Override
  public List<BoardColumn> findByBoardId(Long boardId) {
    return repository.findByBoardIdOrderByPositionAsc(boardId);
  }

  @Override
  public Optional<BoardColumn> findById(Long id) {
    return repository.findById(id);
  }

  @Override
  public boolean existsByBoardIdAndPosition(Long boardId, Integer position) {
    return repository.existsByBoardIdAndPosition(boardId, position);
  }

  @Override
  public boolean existsByBoardIdAndPositionAndIdNot(Long boardId, Integer position, Long id) {
    return repository.existsByBoardIdAndPositionAndIdNot(boardId, position, id);
  }

  @Override
  public BoardColumn save(BoardColumn boardColumn) {
    return repository.save(boardColumn);
  }

  @Override
  public void delete(BoardColumn boardColumn) {
    repository.delete(boardColumn);
  }
}