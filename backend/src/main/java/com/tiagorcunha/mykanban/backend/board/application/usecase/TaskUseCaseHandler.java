package com.tiagorcunha.mykanban.backend.board.application.usecase;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tiagorcunha.mykanban.backend.board.application.command.SaveTaskCommand;
import com.tiagorcunha.mykanban.backend.board.application.mapper.TaskResponseMapper;
import com.tiagorcunha.mykanban.backend.board.application.port.in.TaskUseCase;
import com.tiagorcunha.mykanban.backend.board.application.port.out.BoardColumnRepositoryPort;
import com.tiagorcunha.mykanban.backend.board.application.port.out.TaskRepositoryPort;
import com.tiagorcunha.mykanban.backend.board.application.response.TaskResponse;
import com.tiagorcunha.mykanban.backend.board.domain.model.Board;
import com.tiagorcunha.mykanban.backend.board.domain.model.BoardColumn;
import com.tiagorcunha.mykanban.backend.board.domain.model.Task;
import com.tiagorcunha.mykanban.backend.common.application.exception.ConflictException;
import com.tiagorcunha.mykanban.backend.common.application.exception.ResourceNotFoundException;
import com.tiagorcunha.mykanban.backend.common.infrastructure.security.AuthenticatedUserProvider;
import com.tiagorcunha.mykanban.backend.user.application.port.out.UserRepositoryPort;
import com.tiagorcunha.mykanban.backend.user.domain.model.User;

@Service
public class TaskUseCaseHandler implements TaskUseCase {

  private final TaskRepositoryPort taskRepository;
  private final BoardColumnRepositoryPort boardColumnRepository;
  private final UserRepositoryPort userRepository;
  private final AuthenticatedUserProvider authenticatedUserProvider;
  private final BoardAuthorizationService boardAuthorizationService;

  public TaskUseCaseHandler(
      TaskRepositoryPort taskRepository,
      BoardColumnRepositoryPort boardColumnRepository,
      UserRepositoryPort userRepository,
      AuthenticatedUserProvider authenticatedUserProvider,
      BoardAuthorizationService boardAuthorizationService) {
    this.taskRepository = taskRepository;
    this.boardColumnRepository = boardColumnRepository;
    this.userRepository = userRepository;
    this.authenticatedUserProvider = authenticatedUserProvider;
    this.boardAuthorizationService = boardAuthorizationService;
  }

  @Override
  @Transactional(readOnly = true)
  public List<TaskResponse> findByColumnId(Long columnId) {
    User currentUser = authenticatedUserProvider.getAuthenticatedUser();
    BoardColumn boardColumn = requireBoardColumn(columnId);
    boardAuthorizationService.assertCanReadBoard(boardColumn.getBoard(), currentUser);
    return taskRepository.findByColumnId(columnId).stream()
        .map(TaskResponseMapper::toResponse)
        .toList();
  }

  @Override
  @Transactional
  public TaskResponse create(Long columnId, SaveTaskCommand command) {
    User currentUser = authenticatedUserProvider.getAuthenticatedUser();
    BoardColumn boardColumn = requireBoardColumn(columnId);
    Board board = boardColumn.getBoard();
    boardAuthorizationService.assertCanCreateTask(board, currentUser);
    if (taskRepository.existsByColumnIdAndPosition(columnId, command.position())) {
      throw new ConflictException("Task position already in use");
    }

    LocalDateTime now = LocalDateTime.now();
    Task task = new Task();
    task.setTitle(command.title());
    task.setDescription(command.description());
    task.setPriority(command.priority());
    task.setDueDate(command.dueDate());
    task.setEstimatedHours(command.estimatedHours());
    task.setPosition(command.position());
    task.setBoardColumn(boardColumn);
    task.setReportedBy(currentUser);
    task.setAssignees(resolveAssignees(command.assigneeIds()));
    task.setCreatedAt(now);
    task.setUpdatedAt(now);
    return TaskResponseMapper.toResponse(taskRepository.save(task));
  }

  @Override
  @Transactional
  public TaskResponse update(Long columnId, Long taskId, SaveTaskCommand command) {
    User currentUser = authenticatedUserProvider.getAuthenticatedUser();
    Task task = getExistingTask(columnId, taskId);
    boardAuthorizationService.assertCanManageTask(task, currentUser);
    if (taskRepository.existsByColumnIdAndPositionAndIdNot(columnId, command.position(), taskId)) {
      throw new ConflictException("Task position already in use");
    }

    task.setTitle(command.title());
    task.setDescription(command.description());
    task.setPriority(command.priority());
    task.setDueDate(command.dueDate());
    task.setEstimatedHours(command.estimatedHours());
    task.setPosition(command.position());
    task.setReportedBy(task.getReportedBy());
    task.setAssignees(resolveAssignees(command.assigneeIds()));
    task.setUpdatedAt(LocalDateTime.now());
    return TaskResponseMapper.toResponse(taskRepository.save(task));
  }

  @Override
  @Transactional
  public void delete(Long columnId, Long taskId) {
    User currentUser = authenticatedUserProvider.getAuthenticatedUser();
    Task task = getExistingTask(columnId, taskId);
    boardAuthorizationService.assertCanManageTask(task, currentUser);
    taskRepository.delete(task);
  }

  private BoardColumn requireBoardColumn(Long columnId) {
    return boardColumnRepository.findById(columnId)
        .orElseThrow(() -> new ResourceNotFoundException("Board column not found"));
  }

  private Task getExistingTask(Long columnId, Long taskId) {
    Task task = taskRepository.findById(taskId)
        .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
    if (!task.getBoardColumn().getId().equals(columnId)) {
      throw new ResourceNotFoundException("Task not found");
    }
    return task;
  }

  private Set<User> resolveAssignees(List<Long> assigneeIds) {
    LinkedHashSet<Long> uniqueAssigneeIds = assigneeIds == null
        ? new LinkedHashSet<>()
        : new LinkedHashSet<>(assigneeIds);
    List<User> assignees = userRepository.findAllById(uniqueAssigneeIds);
    if (assignees.size() != uniqueAssigneeIds.size()) {
      throw new ResourceNotFoundException("One or more assignees were not found");
    }
    return new LinkedHashSet<>(assignees);
  }
}