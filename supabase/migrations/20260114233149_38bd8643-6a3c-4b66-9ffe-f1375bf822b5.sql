-- Restrict the base profiles table to only allow viewing own profile or if admin
-- First drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Profiles visíveis para autenticados" ON public.profiles;

-- Create a new policy that restricts access
CREATE POLICY "Usuários veem próprio perfil ou admin vê todos"
ON public.profiles
FOR SELECT
USING (auth.uid() = id OR has_role(auth.uid(), 'admin'::app_role));