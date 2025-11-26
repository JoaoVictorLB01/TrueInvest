-- Criar enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'corretor');

-- Tabela de perfis dos corretores
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  foto TEXT,
  telefone TEXT,
  pontos_totais INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de roles de usuário
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'corretor',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Registros de ponto
CREATE TABLE public.registros_ponto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  entrada TIMESTAMPTZ NOT NULL,
  saida TIMESTAMPTZ,
  localizacao_entrada TEXT,
  localizacao_saida TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Metas disponíveis
CREATE TABLE public.metas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT NOT NULL, -- 'reunioes', 'vendas', 'visitas', 'pontuacao'
  valor_objetivo INTEGER NOT NULL,
  pontos_recompensa INTEGER NOT NULL,
  periodo TEXT NOT NULL DEFAULT 'mensal', -- 'diario', 'semanal', 'mensal'
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Progresso das metas por usuário
CREATE TABLE public.progresso_metas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  meta_id UUID REFERENCES public.metas(id) ON DELETE CASCADE NOT NULL,
  valor_atual INTEGER DEFAULT 0,
  completada BOOLEAN DEFAULT false,
  data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  data_fim DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Conquistas disponíveis
CREATE TABLE public.conquistas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  icone TEXT,
  pontos_recompensa INTEGER DEFAULT 0,
  requisito_tipo TEXT, -- 'vendas', 'reunioes', 'pontos', 'tempo_servico'
  requisito_valor INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Conquistas desbloqueadas pelos usuários
CREATE TABLE public.user_conquistas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  conquista_id UUID REFERENCES public.conquistas(id) ON DELETE CASCADE NOT NULL,
  desbloqueada_em TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, conquista_id)
);

-- Atividades/Reuniões
CREATE TABLE public.atividades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT NOT NULL, -- 'reuniao', 'visita', 'ligacao'
  data_hora TIMESTAMPTZ NOT NULL,
  cliente_nome TEXT,
  cliente_contato TEXT,
  status TEXT DEFAULT 'agendada', -- 'agendada', 'concluida', 'cancelada'
  pontos_ganhos INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Vendas
CREATE TABLE public.vendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  imovel_nome TEXT NOT NULL,
  valor DECIMAL(12,2) NOT NULL,
  comissao DECIMAL(12,2),
  cliente_nome TEXT,
  data_venda DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'em_andamento', -- 'em_andamento', 'concluida', 'cancelada'
  pontos_ganhos INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_ponto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progresso_metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conquistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_conquistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;

-- Função para verificar role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Função para criar perfil e role ao registrar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nome', NEW.email),
    NEW.email
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'corretor');
  
  RETURN NEW;
END;
$$;

-- Triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_progresso_metas_updated_at
  BEFORE UPDATE ON public.progresso_metas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_atividades_updated_at
  BEFORE UPDATE ON public.atividades
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_vendas_updated_at
  BEFORE UPDATE ON public.vendas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS Policies

-- Profiles: usuários veem todos (para ranking), editam próprio
CREATE POLICY "Profiles visíveis para autenticados" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuários editam próprio perfil" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- User Roles: apenas admins veem e gerenciam
CREATE POLICY "Admins gerenciam roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Usuários veem próprio role" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Registros Ponto: próprios registros, admins veem todos
CREATE POLICY "Usuários veem próprios pontos" ON public.registros_ponto
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Usuários inserem próprios pontos" ON public.registros_ponto
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários atualizam próprios pontos" ON public.registros_ponto
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Metas: todos veem, admins gerenciam
CREATE POLICY "Metas visíveis para autenticados" ON public.metas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins gerenciam metas" ON public.metas
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Progresso Metas: próprio progresso
CREATE POLICY "Usuários veem próprio progresso" ON public.progresso_metas
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Usuários inserem próprio progresso" ON public.progresso_metas
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários atualizam próprio progresso" ON public.progresso_metas
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Conquistas: todos veem
CREATE POLICY "Conquistas visíveis para autenticados" ON public.conquistas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins gerenciam conquistas" ON public.conquistas
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- User Conquistas: próprias conquistas
CREATE POLICY "Usuários veem próprias conquistas" ON public.user_conquistas
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Sistema insere conquistas" ON public.user_conquistas
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Atividades: próprias atividades
CREATE POLICY "Usuários gerenciam próprias atividades" ON public.atividades
  FOR ALL TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Vendas: próprias vendas
CREATE POLICY "Usuários gerenciam próprias vendas" ON public.vendas
  FOR ALL TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Inserir metas padrão
INSERT INTO public.metas (titulo, descricao, tipo, valor_objetivo, pontos_recompensa, periodo) VALUES
  ('Reuniões Diárias', 'Realize 3 reuniões por dia', 'reunioes', 3, 50, 'diario'),
  ('Reuniões Semanais', 'Realize 15 reuniões por semana', 'reunioes', 15, 200, 'semanal'),
  ('Reuniões Mensais', 'Realize 60 reuniões por mês', 'reunioes', 60, 500, 'mensal'),
  ('Vendas Mensais', 'Realize 5 vendas por mês', 'vendas', 5, 1000, 'mensal'),
  ('Visitas Semanais', 'Realize 10 visitas por semana', 'visitas', 10, 150, 'semanal'),
  ('Pontualidade', 'Chegue no horário todos os dias do mês', 'pontualidade', 22, 300, 'mensal');

-- Inserir conquistas padrão
INSERT INTO public.conquistas (titulo, descricao, icone, pontos_recompensa, requisito_tipo, requisito_valor) VALUES
  ('Primeira Venda', 'Realize sua primeira venda', 'trophy', 100, 'vendas', 1),
  ('Top Vendedor', 'Realize 10 vendas', 'star', 500, 'vendas', 10),
  ('Mestre das Reuniões', 'Realize 100 reuniões', 'users', 300, 'reunioes', 100),
  ('Pontual', 'Chegue no horário por 30 dias', 'clock', 200, 'pontualidade', 30),
  ('Veterano', '6 meses na empresa', 'medal', 400, 'tempo_servico', 180),
  ('Milionário', 'Acumule 10.000 pontos', 'gem', 1000, 'pontos', 10000);