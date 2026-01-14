-- Drop the view that was created with SECURITY DEFINER issue
DROP VIEW IF EXISTS public.profiles_public;

-- Recreate the view with explicit SECURITY INVOKER (which is the default but being explicit)
CREATE VIEW public.profiles_public 
WITH (security_invoker = true)
AS
SELECT 
  id,
  nome,
  foto,
  pontos_totais
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.profiles_public TO authenticated;
GRANT SELECT ON public.profiles_public TO anon;