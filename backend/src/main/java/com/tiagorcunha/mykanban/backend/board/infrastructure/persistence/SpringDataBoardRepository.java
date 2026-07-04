package com.tiagorcunha.mykanban.backend.board.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import com.tiagorcunha.mykanban.backend.board.domain.model.Board;

public interface SpringDataBoardRepository extends JpaRepository<Board, Long> {
}