package com.tiagorcunha.mykanban.backend.board.infrastructure.persistence;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Component;

import com.tiagorcunha.mykanban.backend.board.application.port.out.BoardRepositoryPort;
import com.tiagorcunha.mykanban.backend.board.domain.model.Board;

@Component
public class BoardRepositoryAdapter implements BoardRepositoryPort {

  private final SpringDataBoardRepository repository;

  public BoardRepositoryAdapter(SpringDataBoardRepository repository) {
    this.repository = repository;
  }

  @Override
  public List<Board> findAll() {
    return repository.findAll();
  }

  @Override
  public Optional<Board> findById(Long id) {
    return repository.findById(id);
  }

  @Override
  public boolean existsById(Long id) {
    return repository.existsById(id);
  }

  @Override
  public Board save(Board board) {
    return repository.save(board);
  }

  @Override
  public void deleteById(Long id) {
    repository.deleteById(id);
  }
}