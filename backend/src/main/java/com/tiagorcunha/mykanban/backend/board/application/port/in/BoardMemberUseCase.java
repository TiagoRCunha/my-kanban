package com.tiagorcunha.mykanban.backend.board.application.port.in;

import java.util.List;

import com.tiagorcunha.mykanban.backend.board.application.command.InviteBoardMemberCommand;
import com.tiagorcunha.mykanban.backend.board.application.command.UpdateBoardMemberRoleCommand;
import com.tiagorcunha.mykanban.backend.board.application.response.BoardMemberResponse;

public interface BoardMemberUseCase {

  List<BoardMemberResponse> listMembers(Long boardId);

  BoardMemberResponse inviteMember(Long boardId, InviteBoardMemberCommand command);

  BoardMemberResponse updateMemberRole(Long boardId, Long memberId, UpdateBoardMemberRoleCommand command);

  void removeMember(Long boardId, Long memberId);
}
