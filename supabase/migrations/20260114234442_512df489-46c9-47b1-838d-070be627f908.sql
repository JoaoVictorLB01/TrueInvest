-- Fix 1: Revoke anon access from profiles_public view since base table requires authentication
REVOKE SELECT ON public.profiles_public FROM anon;

-- Fix 2: Add storage policies for login-assets bucket

-- Allow anyone to read login assets (needed for login page to display)
CREATE POLICY "Public read login assets"
ON storage.objects
FOR SELECT
USING (bucket_id = 'login-assets');

-- Only admins can upload login assets
CREATE POLICY "Only admins upload login assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'login-assets' AND
  public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Only admins can update login assets  
CREATE POLICY "Only admins update login assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'login-assets' AND
  public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Only admins can delete login assets
CREATE POLICY "Only admins delete login assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'login-assets' AND
  public.has_role(auth.uid(), 'admin'::public.app_role)
);