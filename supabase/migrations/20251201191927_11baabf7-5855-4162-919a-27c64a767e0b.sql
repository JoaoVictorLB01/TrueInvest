
-- Criar tabela de reuniões
CREATE TABLE public.reunioes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  link TEXT,
  data_hora TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'agendada',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de notificações
CREATE TABLE public.notificacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'reuniao',
  titulo TEXT NOT NULL,
  mensagem TEXT,
  referencia_id UUID,
  lida BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.reunioes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

-- Políticas para reuniões
CREATE POLICY "Reuniões visíveis para autenticados"
ON public.reunioes
FOR SELECT
USING (true);

CREATE POLICY "Admins gerenciam reuniões"
ON public.reunioes
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Políticas para notificações
CREATE POLICY "Usuários veem próprias notificações"
ON public.notificacoes
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários atualizam próprias notificações"
ON public.notificacoes
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Sistema insere notificações"
ON public.notificacoes
FOR INSERT
WITH CHECK (true);

-- Trigger para updated_at em reuniões
CREATE TRIGGER update_reunioes_updated_at
BEFORE UPDATE ON public.reunioes
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
