package com.tiagorcunha.mykanban.backend.board.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.Set;

import com.tiagorcunha.mykanban.backend.user.domain.model.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "tasks")
public class Task {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 150)
  private String title;

  @Column(columnDefinition = "TEXT")
  private String description;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 10)
  private TaskPriority priority = TaskPriority.MEDIUM;

  @Column(name = "due_date")
  private LocalDate dueDate;

  @Column(name = "estimated_hours", precision = 5, scale = 2)
  private BigDecimal estimatedHours;

  @Column(nullable = false)
  private Integer position;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "column_id", nullable = false)
  private BoardColumn boardColumn;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "reported_by", nullable = false)
  private User reportedBy;

  @ManyToMany(fetch = FetchType.LAZY)
  @JoinTable(
      name = "task_assignees",
      joinColumns = @JoinColumn(name = "task_id"),
      inverseJoinColumns = @JoinColumn(name = "user_id"))
  private Set<User> assignees = new LinkedHashSet<>();

  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public TaskPriority getPriority() {
    return priority;
  }

  public void setPriority(TaskPriority priority) {
    this.priority = priority;
  }

  public LocalDate getDueDate() {
    return dueDate;
  }

  public void setDueDate(LocalDate dueDate) {
    this.dueDate = dueDate;
  }

  public BigDecimal getEstimatedHours() {
    return estimatedHours;
  }

  public void setEstimatedHours(BigDecimal estimatedHours) {
    this.estimatedHours = estimatedHours;
  }

  public Integer getPosition() {
    return position;
  }

  public void setPosition(Integer position) {
    this.position = position;
  }

  public BoardColumn getBoardColumn() {
    return boardColumn;
  }

  public void setBoardColumn(BoardColumn boardColumn) {
    this.boardColumn = boardColumn;
  }

  public User getReportedBy() {
    return reportedBy;
  }

  public void setReportedBy(User reportedBy) {
    this.reportedBy = reportedBy;
  }

  public Set<User> getAssignees() {
    return assignees;
  }

  public void setAssignees(Set<User> assignees) {
    this.assignees = assignees;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
  }

  public LocalDateTime getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(LocalDateTime updatedAt) {
    this.updatedAt = updatedAt;
  }
}