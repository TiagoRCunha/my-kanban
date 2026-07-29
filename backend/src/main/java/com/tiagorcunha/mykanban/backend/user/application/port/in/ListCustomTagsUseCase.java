package com.tiagorcunha.mykanban.backend.user.application.port.in;

import java.util.List;

import com.tiagorcunha.mykanban.backend.user.application.response.CustomTagResponse;

public interface ListCustomTagsUseCase {

  List<CustomTagResponse> findCustomTagsByUserId(Long userId);
}
