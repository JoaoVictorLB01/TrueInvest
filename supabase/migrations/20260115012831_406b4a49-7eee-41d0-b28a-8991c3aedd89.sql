-- Tighten access to profiles_public view (leaderboard)
-- Goal: ensure the view is not readable by anonymous/public roles.

REVOKE ALL ON public.profiles_public FROM PUBLIC;
REVOKE SELECT ON public.profiles_public FROM anon;
GRANT SELECT ON public.profiles_public TO authenticated;
