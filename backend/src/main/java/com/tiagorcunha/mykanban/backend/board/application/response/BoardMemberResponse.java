package com.tiagorcunha.mykanban.backend.board.application.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "BoardMemberResponse", description = "Board member representation returned by the API")
public record BoardMemberResponse(
    @Schema(example = "1")
    Long id,
    @Schema(example = "10")
    Long boardId,
    @Schema(example = "5")
    Long userId,
    @Schema(description = "Member email", example = "user@example.com")
    String email,
    @Schema(description = "Member full name", example = "Jane Doe")
    String fullName,
    @Schema(description = "Member role on this board", example = "GUEST")
    String role) {
}
