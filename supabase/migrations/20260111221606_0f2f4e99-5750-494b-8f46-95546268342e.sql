-- Criar tabela de configurações globais do app
CREATE TABLE public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem ler as configurações (necessário para a tela de login)
CREATE POLICY "Configurações visíveis para todos"
ON public.app_settings
FOR SELECT
USING (true);

-- Política: Apenas admins podem inserir/atualizar/deletar
CREATE POLICY "Admins gerenciam configurações"
ON public.app_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_app_settings_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Inserir configurações padrão
INSERT INTO public.app_settings (key, value) VALUES
  ('login_background_type', 'none'),
  ('login_background_url', null),
  ('logo_url', null);

-- Criar bucket para assets de login
INSERT INTO storage.buckets (id, name, public) 
VALUES ('login-assets', 'login-assets', true);

-- Políticas de storage: todos podem ver
CREATE POLICY "Login assets são públicos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'login-assets');

-- Apenas admins podem fazer upload
CREATE POLICY "Admins podem fazer upload de login assets"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'login-assets' AND has_role(auth.uid(), 'admin'::app_role));

-- Apenas admins podem atualizar
CREATE POLICY "Admins podem atualizar login assets"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'login-assets' AND has_role(auth.uid(), 'admin'::app_role));

-- Apenas admins podem deletar
CREATE POLICY "Admins podem deletar login assets"
ON storage.objects
FOR DELETE
USING (bucket_id = 'login-assets' AND has_role(auth.uid(), 'admin'::app_role));