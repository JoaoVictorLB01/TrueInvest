-- Drop the existing view and recreate with security_invoker enabled
-- This ensures the view respects the RLS policies of the underlying profiles table
DROP VIEW IF EXISTS public.profiles_public;

-- Recreate the view with security_invoker=on
-- This view exposes only non-sensitive fields for leaderboard purposes
CREATE VIEW public.profiles_public
WITH (security_invoker=on) AS
SELECT 
    id,
    nome,
    foto,
    pontos_totais
FROM public.profiles;