-- ─── V2: Add archived/done columns and task done flag ───────────────────────

-- Add archived and is_done flags to board_columns
ALTER TABLE board_columns
  ADD COLUMN archived BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN is_done BOOLEAN NOT NULL DEFAULT FALSE;

-- Add done flag to tasks
ALTER TABLE tasks
  ADD COLUMN done BOOLEAN NOT NULL DEFAULT FALSE;

-- Add type to user_startup_columns (NORMAL, ARCHIVE, DONE)
ALTER TABLE user_startup_columns
  ADD COLUMN type VARCHAR(20) NOT NULL DEFAULT 'NORMAL';
