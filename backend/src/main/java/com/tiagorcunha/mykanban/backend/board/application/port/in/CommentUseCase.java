package com.tiagorcunha.mykanban.backend.board.application.port.in;

import java.util.List;

import com.tiagorcunha.mykanban.backend.board.application.command.SaveCommentCommand;
import com.tiagorcunha.mykanban.backend.board.application.response.CommentResponse;

public interface CommentUseCase {

  List<CommentResponse> findByTaskId(Long taskId);

  CommentResponse create(Long taskId, SaveCommentCommand command);

  CommentResponse update(Long taskId, Long commentId, SaveCommentCommand command);

  void delete(Long taskId, Long commentId);
}