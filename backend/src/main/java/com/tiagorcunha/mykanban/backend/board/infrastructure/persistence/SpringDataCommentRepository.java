package com.tiagorcunha.mykanban.backend.board.infrastructure.persistence;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.tiagorcunha.mykanban.backend.board.domain.model.Comment;

public interface SpringDataCommentRepository extends JpaRepository<Comment, Long> {

  List<Comment> findByTaskIdOrderByCreatedAtAsc(Long taskId);
}