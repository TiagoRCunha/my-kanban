package com.tiagorcunha.mykanban.backend.board.infrastructure.persistence;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Component;

import com.tiagorcunha.mykanban.backend.board.application.port.out.BoardMemberRepositoryPort;
import com.tiagorcunha.mykanban.backend.board.domain.model.BoardMember;

@Component
public class BoardMemberRepositoryAdapter implements BoardMemberRepositoryPort {

  private final SpringDataBoardMemberRepository repository;

  public BoardMemberRepositoryAdapter(SpringDataBoardMemberRepository repository) {
    this.repository = repository;
  }

  @Override
  public Optional<BoardMember> findById(Long id) {
    return repository.findById(id);
  }

  @Override
  public Optional<BoardMember> findByBoardIdAndUserId(Long boardId, Long userId) {
    return repository.findByBoardIdAndUserId(boardId, userId);
  }

  @Override
  public List<BoardMember> findAllByBoardId(Long boardId) {
    return repository.findByBoardId(boardId);
  }

  @Override
  public BoardMember save(BoardMember boardMember) {
    return repository.save(boardMember);
  }

  @Override
  public void delete(BoardMember boardMember) {
    repository.delete(boardMember);
  }
}
