package com.tiagorcunha.mykanban.backend.board.infrastructure.persistence;

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
  public Optional<BoardMember> findByBoardIdAndUserId(Long boardId, Long userId) {
    return repository.findByBoardIdAndUserId(boardId, userId);
  }
}
