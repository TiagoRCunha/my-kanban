-- ─── V3: Add default_task_limit to user_configs ───────────────────────────────
-- Allows users to configure how many tasks are shown per column by default.

ALTER TABLE user_configs
    ADD COLUMN default_task_limit INT NOT NULL DEFAULT 10;
