-- Ensure progresso_metas table tracks user goal completions properly
-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_progresso_metas_user_meta ON progresso_metas(user_id, meta_id);

-- Add unique constraint to prevent duplicate completions
ALTER TABLE progresso_metas DROP CONSTRAINT IF EXISTS unique_user_meta_periodo;
ALTER TABLE progresso_metas ADD CONSTRAINT unique_user_meta_periodo 
  UNIQUE (user_id, meta_id, data_inicio);