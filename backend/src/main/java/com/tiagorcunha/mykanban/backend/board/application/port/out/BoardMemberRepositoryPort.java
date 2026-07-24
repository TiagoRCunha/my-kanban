package com.tiagorcunha.mykanban.backend.board.application.port.out;

import java.util.Optional;

import com.tiagorcunha.mykanban.backend.board.domain.model.BoardMember;

public interface BoardMemberRepositoryPort {

  Optional<BoardMember> findByBoardIdAndUserId(Long boardId, Long userId);
}
