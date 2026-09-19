package com.tiagorcunha.mykanban.backend.board.application.port.out;

import java.util.List;
import java.util.Optional;

import com.tiagorcunha.mykanban.backend.board.domain.model.BoardMember;

public interface BoardMemberRepositoryPort {

  Optional<BoardMember> findById(Long id);

  Optional<BoardMember> findByBoardIdAndUserId(Long boardId, Long userId);

  List<BoardMember> findAllByBoardId(Long boardId);

  BoardMember save(BoardMember boardMember);

  void delete(BoardMember boardMember);
}
