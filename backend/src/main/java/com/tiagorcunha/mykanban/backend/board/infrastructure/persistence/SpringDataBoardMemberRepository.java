package com.tiagorcunha.mykanban.backend.board.infrastructure.persistence;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.tiagorcunha.mykanban.backend.board.domain.model.BoardMember;

public interface SpringDataBoardMemberRepository extends JpaRepository<BoardMember, Long> {

  Optional<BoardMember> findByBoardIdAndUserId(Long boardId, Long userId);
}
