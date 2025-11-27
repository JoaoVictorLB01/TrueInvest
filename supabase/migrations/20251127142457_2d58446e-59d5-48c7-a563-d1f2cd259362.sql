-- Remove a constraint que impede remarcar metas no mesmo dia
ALTER TABLE progresso_metas DROP CONSTRAINT IF EXISTS unique_user_meta_periodo;

-- Adiciona constraint mais flexível que permite múltiplas marcações
-- mas mantém integridade dos dados ativos
CREATE UNIQUE INDEX IF NOT EXISTS idx_progresso_metas_active 
  ON progresso_metas(user_id, meta_id) 
  WHERE completada = true;