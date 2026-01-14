-- Fix the overly permissive RLS policy on notificacoes
-- Drop the existing permissive policy
DROP POLICY IF EXISTS "Sistema insere notificações" ON public.notificacoes;

-- Create a more restrictive policy that only allows:
-- 1. Users to insert notifications for themselves
-- 2. Admins to insert notifications for anyone
CREATE POLICY "Sistema insere notificações seguro"
ON public.notificacoes
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Create a public view for ranking that only exposes necessary fields
CREATE OR REPLACE VIEW public.profiles_public AS
SELECT 
  id,
  nome,
  foto,
  pontos_totais
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.profiles_public TO authenticated;
GRANT SELECT ON public.profiles_public TO anon;

-- Add database constraints for input validation
ALTER TABLE public.metas ADD CONSTRAINT metas_titulo_length CHECK (length(titulo) <= 200);
ALTER TABLE public.metas ADD CONSTRAINT metas_descricao_length CHECK (length(descricao) <= 2000);

ALTER TABLE public.reunioes ADD CONSTRAINT reunioes_titulo_length CHECK (length(titulo) <= 200);
ALTER TABLE public.reunioes ADD CONSTRAINT reunioes_descricao_length CHECK (length(descricao) <= 2000);
ALTER TABLE public.reunioes ADD CONSTRAINT reunioes_link_length CHECK (length(link) <= 500);

ALTER TABLE public.profiles ADD CONSTRAINT profiles_nome_length CHECK (length(nome) <= 150);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_length CHECK (length(email) <= 255);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_telefone_length CHECK (length(telefone) <= 20);