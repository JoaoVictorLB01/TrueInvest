-- Add tipo_meta column to metas table
ALTER TABLE public.metas 
ADD COLUMN tipo_meta text NOT NULL DEFAULT 'unica' 
CHECK (tipo_meta IN ('unica', 'recorrente'));

-- Create meta_eventos table to track each completion event
CREATE TABLE public.meta_eventos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  meta_id uuid NOT NULL REFERENCES public.metas(id) ON DELETE CASCADE,
  data_hora timestamp with time zone NOT NULL DEFAULT now(),
  pontos_ganhos integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meta_eventos ENABLE ROW LEVEL SECURITY;

-- Users can view their own events
CREATE POLICY "Usuários veem próprios eventos de meta"
ON public.meta_eventos
FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Users can insert their own events
CREATE POLICY "Usuários inserem próprios eventos de meta"
ON public.meta_eventos
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own events (for undo functionality)
CREATE POLICY "Usuários deletam próprios eventos de meta"
ON public.meta_eventos
FOR DELETE
USING (auth.uid() = user_id);

-- Add index for better query performance
CREATE INDEX idx_meta_eventos_user_meta ON public.meta_eventos(user_id, meta_id);
CREATE INDEX idx_meta_eventos_data_hora ON public.meta_eventos(data_hora DESC);

-- Add DELETE policy to progresso_metas (needed for cleanup)
CREATE POLICY "Usuários deletam próprio progresso"
ON public.progresso_metas
FOR DELETE
USING (auth.uid() = user_id);