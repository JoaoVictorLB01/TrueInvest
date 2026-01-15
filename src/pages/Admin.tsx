import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Shield, Trash2, Users, LogOut, Search, Edit, Target, Plus, UserCog, Video, Link, Calendar, X, Settings, Clock } from "lucide-react";
import Header from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import LoginSettingsDialog from "@/components/LoginSettingsDialog";

interface UserProfile {
  id: string;
  nome: string;
  email: string;
  pontos_totais: number;
  telefone?: string;
  is_admin?: boolean;
}

interface Meta {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: string;
  tipo_meta: 'unica' | 'recorrente';
  valor_objetivo: number;
  pontos_recompensa: number;
  periodo: string;
  ativo: boolean | null;
  created_at: string | null;
}

interface Reuniao {
  id: string;
  titulo: string;
  descricao: string | null;
  link: string | null;
  data_hora: string;
  status: string | null;
  created_by: string;
  created_at: string | null;
}

interface RegistroPonto {
  id: string;
  user_id: string;
  entrada: string;
  saida: string | null;
  localizacao_entrada: string | null;
  localizacao_saida: string | null;
  created_at: string | null;
  user_nome?: string;
  user_email?: string;
}

const Admin = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editTelefone, setEditTelefone] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Estados para Metas
  const [metas, setMetas] = useState<Meta[]>([]);
  const [metaDialogOpen, setMetaDialogOpen] = useState(false);
  const [editingMeta, setEditingMeta] = useState<Meta | null>(null);
  const [metaTitulo, setMetaTitulo] = useState("");
  const [metaDescricao, setMetaDescricao] = useState("");
  const [metaTipo, setMetaTipo] = useState("vendas");
  const [metaValorObjetivo, setMetaValorObjetivo] = useState("");
  const [metaPontosRecompensa, setMetaPontosRecompensa] = useState("");
  const [metaPeriodo, setMetaPeriodo] = useState("mensal");
  const [metaTipoMeta, setMetaTipoMeta] = useState<'unica' | 'recorrente'>("unica");
  const [metaAtivo, setMetaAtivo] = useState(true);
  const [savingMeta, setSavingMeta] = useState(false);

  // Estados para Reuniões
  const [reunioes, setReunioes] = useState<Reuniao[]>([]);
  const [reuniaoDialogOpen, setReuniaoDialogOpen] = useState(false);
  const [editingReuniao, setEditingReuniao] = useState<Reuniao | null>(null);
  const [reuniaoTitulo, setReuniaoTitulo] = useState("");
  const [reuniaoDescricao, setReuniaoDescricao] = useState("");
  const [reuniaoLink, setReuniaoLink] = useState("");
  const [reuniaoData, setReuniaoData] = useState("");
  const [reuniaoHora, setReuniaoHora] = useState("");
  const [savingReuniao, setSavingReuniao] = useState(false);

  // Estado para configurações de login
  const [loginSettingsOpen, setLoginSettingsOpen] = useState(false);

  // Estados para Registros de Ponto
  const [registrosPonto, setRegistrosPonto] = useState<RegistroPonto[]>([]);
  const [pontoSearchTerm, setPontoSearchTerm] = useState("");
  const [pontoDataFiltro, setPontoDataFiltro] = useState("");

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });

    if (error || !data) {
      toast.error("Acesso negado. Você não é um administrador.");
      navigate("/dashboard");
      return;
    }

    setIsAdmin(true);
    await fetchUsers();
    await fetchMetas();
    await fetchReunioes();
    await fetchRegistrosPonto();
    setLoading(false);
  };

  const fetchUsers = async () => {
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, nome, email, pontos_totais, telefone')
      .order('nome');

    if (profilesError) {
      toast.error("Erro ao carregar usuários");
      return;
    }

    // Verificar quais usuários são admins
    const { data: rolesData } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .eq('role', 'admin');

    const adminIds = new Set(rolesData?.map(r => r.user_id) || []);

    const usersWithRoles = (profilesData || []).map(user => ({
      ...user,
      is_admin: adminIds.has(user.id)
    }));

    setUsers(usersWithRoles);
  };

  const fetchMetas = async () => {
    const { data, error } = await supabase
      .from('metas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Erro ao carregar metas");
      return;
    }

    setMetas((data as Meta[]) || []);
  };

  const fetchReunioes = async () => {
    const { data, error } = await supabase
      .from('reunioes')
      .select('*')
      .order('data_hora', { ascending: true });

    if (error) {
      toast.error("Erro ao carregar reuniões");
      return;
    }

    setReunioes(data || []);
  };

  const fetchRegistrosPonto = async () => {
    // Buscar registros de ponto de todos os usuários (admin pode ver todos via RLS)
    const { data: pontosData, error: pontosError } = await supabase
      .from('registros_ponto')
      .select('*')
      .order('entrada', { ascending: false })
      .limit(500);

    if (pontosError) {
      console.error("Erro ao carregar registros de ponto:", pontosError);
      return;
    }

    // Buscar dados dos usuários para associar nomes
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, nome, email');

    const profilesMap = new Map(
      (profilesData || []).map(p => [p.id, { nome: p.nome, email: p.email }])
    );

    const registrosComUsuario: RegistroPonto[] = (pontosData || []).map(ponto => ({
      ...ponto,
      user_nome: profilesMap.get(ponto.user_id)?.nome || 'Usuário desconhecido',
      user_email: profilesMap.get(ponto.user_id)?.email || ''
    }));

    setRegistrosPonto(registrosComUsuario);
  };

  const openMetaDialog = (meta?: Meta) => {
    if (meta) {
      setEditingMeta(meta);
      setMetaTitulo(meta.titulo);
      setMetaDescricao(meta.descricao || "");
      setMetaTipo(meta.tipo);
      setMetaTipoMeta(meta.tipo_meta || 'unica');
      setMetaValorObjetivo(String(meta.valor_objetivo));
      setMetaPontosRecompensa(String(meta.pontos_recompensa));
      setMetaPeriodo(meta.periodo);
      setMetaAtivo(meta.ativo ?? true);
    } else {
      setEditingMeta(null);
      setMetaTitulo("");
      setMetaDescricao("");
      setMetaTipo("vendas");
      setMetaTipoMeta("unica");
      setMetaValorObjetivo("");
      setMetaPontosRecompensa("");
      setMetaPeriodo("mensal");
      setMetaAtivo(true);
    }
    setMetaDialogOpen(true);
  };

  const openReuniaoDialog = (reuniao?: Reuniao) => {
    if (reuniao) {
      setEditingReuniao(reuniao);
      setReuniaoTitulo(reuniao.titulo);
      setReuniaoDescricao(reuniao.descricao || "");
      setReuniaoLink(reuniao.link || "");
      const dataHora = new Date(reuniao.data_hora);
      setReuniaoData(dataHora.toISOString().split('T')[0]);
      setReuniaoHora(dataHora.toTimeString().slice(0, 5));
    } else {
      setEditingReuniao(null);
      setReuniaoTitulo("");
      setReuniaoDescricao("");
      setReuniaoLink("");
      setReuniaoData("");
      setReuniaoHora("");
    }
    setReuniaoDialogOpen(true);
  };

  const handleSaveMeta = async () => {
    const trimmedTitulo = metaTitulo.trim();
    const trimmedDescricao = metaDescricao.trim();
    
    if (!trimmedTitulo) {
      toast.error("Título é obrigatório");
      return;
    }

    // Input validation - length limits
    if (trimmedTitulo.length > 200) {
      toast.error("Título muito longo (máx 200 caracteres)");
      return;
    }

    if (trimmedDescricao.length > 2000) {
      toast.error("Descrição muito longa (máx 2000 caracteres)");
      return;
    }

    const valorObj = parseInt(metaValorObjetivo);
    const pontosRec = parseInt(metaPontosRecompensa);

    if (isNaN(valorObj) || valorObj <= 0) {
      toast.error("Valor objetivo deve ser um número positivo");
      return;
    }

    if (isNaN(pontosRec) || pontosRec <= 0) {
      toast.error("Pontos de recompensa deve ser um número positivo");
      return;
    }

    setSavingMeta(true);

    try {
      const metaData = {
        titulo: metaTitulo.trim(),
        descricao: metaDescricao.trim() || null,
        tipo: metaTipo,
        tipo_meta: metaTipoMeta,
        valor_objetivo: valorObj,
        pontos_recompensa: pontosRec,
        periodo: metaPeriodo,
        ativo: metaAtivo,
      };

      if (editingMeta) {
        const { error } = await supabase
          .from('metas')
          .update(metaData)
          .eq('id', editingMeta.id);

        if (error) throw error;
        toast.success("Meta atualizada com sucesso!");
      } else {
        const { error } = await supabase
          .from('metas')
          .insert(metaData);

        if (error) throw error;
        toast.success("Meta criada com sucesso!");
      }

      setMetaDialogOpen(false);
      await fetchMetas();
    } catch (error) {
      toast.error("Erro ao salvar meta");
      console.error(error);
    } finally {
      setSavingMeta(false);
    }
  };

  const handleSaveReuniao = async () => {
    const trimmedTitulo = reuniaoTitulo.trim();
    const trimmedDescricao = reuniaoDescricao.trim();
    const trimmedLink = reuniaoLink.trim();
    
    if (!trimmedTitulo) {
      toast.error("Título é obrigatório");
      return;
    }

    // Input validation - length limits
    if (trimmedTitulo.length > 200) {
      toast.error("Título muito longo (máx 200 caracteres)");
      return;
    }

    if (trimmedDescricao.length > 2000) {
      toast.error("Descrição muito longa (máx 2000 caracteres)");
      return;
    }

    // URL format validation
    if (trimmedLink) {
      if (trimmedLink.length > 500) {
        toast.error("Link muito longo (máx 500 caracteres)");
        return;
      }
      try {
        new URL(trimmedLink);
      } catch {
        toast.error("Link inválido. Use uma URL completa (ex: https://...)");
        return;
      }
    }

    if (!reuniaoData || !reuniaoHora) {
      toast.error("Data e hora são obrigatórios");
      return;
    }

    setSavingReuniao(true);

    try {
      const dataHora = new Date(`${reuniaoData}T${reuniaoHora}:00`).toISOString();

      const reuniaoData_obj = {
        titulo: trimmedTitulo,
        descricao: trimmedDescricao || null,
        link: trimmedLink || null,
        data_hora: dataHora,
        status: 'agendada',
        created_by: user!.id,
      };

      if (editingReuniao) {
        const { error } = await supabase
          .from('reunioes')
          .update(reuniaoData_obj)
          .eq('id', editingReuniao.id);

        if (error) throw error;
        toast.success("Reunião atualizada com sucesso!");
      } else {
        // Criar reunião
        const { data: newReuniao, error } = await supabase
          .from('reunioes')
          .insert(reuniaoData_obj)
          .select()
          .single();

        if (error) throw error;

        // Enviar notificação para todos os usuários
        const allUsers = await supabase
          .from('profiles')
          .select('id');

        if (allUsers.data && allUsers.data.length > 0) {
          const notificacoes = allUsers.data.map(u => ({
            user_id: u.id,
            tipo: 'reuniao',
            titulo: `Nova Reunião: ${reuniaoTitulo.trim()}`,
            mensagem: `Uma nova reunião foi agendada para ${new Date(dataHora).toLocaleDateString('pt-BR')} às ${reuniaoHora}`,
            referencia_id: newReuniao.id,
            lida: false,
          }));

          await supabase.from('notificacoes').insert(notificacoes);
        }

        toast.success("Reunião criada e notificações enviadas!");
      }

      setReuniaoDialogOpen(false);
      await fetchReunioes();
    } catch (error) {
      toast.error("Erro ao salvar reunião");
      console.error(error);
    } finally {
      setSavingReuniao(false);
    }
  };

  const handleDeleteMeta = async (metaId: string, metaTitulo: string) => {
    if (!confirm(`Tem certeza que deseja deletar a meta "${metaTitulo}"?`)) {
      return;
    }

    try {
      // Primeiro deletar progressos relacionados
      await supabase.from('progresso_metas').delete().eq('meta_id', metaId);
      
      // Depois deletar a meta
      const { error } = await supabase
        .from('metas')
        .delete()
        .eq('id', metaId);

      if (error) throw error;

      toast.success("Meta deletada com sucesso!");
      await fetchMetas();
    } catch (error) {
      toast.error("Erro ao deletar meta");
      console.error(error);
    }
  };

  const handleCancelReuniao = async (reuniaoId: string, reuniaoTitulo: string) => {
    if (!confirm(`Tem certeza que deseja cancelar a reunião "${reuniaoTitulo}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('reunioes')
        .update({ status: 'cancelada' })
        .eq('id', reuniaoId);

      if (error) throw error;

      // Notificar todos os usuários sobre o cancelamento
      const allUsers = await supabase
        .from('profiles')
        .select('id');

      if (allUsers.data && allUsers.data.length > 0) {
        const notificacoes = allUsers.data.map(u => ({
          user_id: u.id,
          tipo: 'reuniao_cancelada',
          titulo: `Reunião Cancelada: ${reuniaoTitulo}`,
          mensagem: `A reunião "${reuniaoTitulo}" foi cancelada.`,
          referencia_id: reuniaoId,
          lida: false,
        }));

        await supabase.from('notificacoes').insert(notificacoes);
      }

      toast.success("Reunião cancelada com sucesso!");
      await fetchReunioes();
    } catch (error) {
      toast.error("Erro ao cancelar reunião");
      console.error(error);
    }
  };

  const handleDeleteReuniao = async (reuniaoId: string, reuniaoTitulo: string) => {
    if (!confirm(`Tem certeza que deseja DELETAR a reunião "${reuniaoTitulo}"? Esta ação é irreversível.`)) {
      return;
    }

    try {
      // Deletar notificações relacionadas
      await supabase.from('notificacoes').delete().eq('referencia_id', reuniaoId);

      const { error } = await supabase
        .from('reunioes')
        .delete()
        .eq('id', reuniaoId);

      if (error) throw error;

      toast.success("Reunião deletada com sucesso!");
      await fetchReunioes();
    } catch (error) {
      toast.error("Erro ao deletar reunião");
      console.error(error);
    }
  };

  const handleToggleAdmin = async (userId: string, userName: string, currentIsAdmin: boolean) => {
    // Impedir que o admin remova seu próprio acesso
    if (currentIsAdmin && userId === user?.id) {
      toast.error("Você não pode remover seu próprio acesso de administrador");
      return;
    }

    const action = currentIsAdmin ? "remover" : "conceder";
    if (!confirm(`Tem certeza que deseja ${action} acesso de administrador ${currentIsAdmin ? 'de' : 'para'} ${userName}?`)) {
      return;
    }

    try {
      if (currentIsAdmin) {
        // Remover role de admin
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');

        if (error) throw error;
        toast.success(`Acesso de administrador removido de ${userName}`);
      } else {
        // Adicionar role de admin
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'admin' });

        if (error) throw error;
        toast.success(`Acesso de administrador concedido para ${userName}`);
      }

      await fetchUsers();
    } catch (error) {
      toast.error("Erro ao atualizar permissões");
      console.error(error);
    }
  };

  const handleResetUser = async (userId: string, userName: string) => {
    if (!confirm(`Tem certeza que deseja resetar TODOS os dados de ${userName}? Esta ação não pode ser desfeita!`)) {
      return;
    }

    setResettingUserId(userId);

    try {
      // Deletar progresso de metas
      await supabase.from('progresso_metas').delete().eq('user_id', userId);
      
      // Deletar conquistas do usuário
      await supabase.from('user_conquistas').delete().eq('user_id', userId);
      
      // Deletar registros de ponto
      await supabase.from('registros_ponto').delete().eq('user_id', userId);
      
      // Deletar atividades
      await supabase.from('atividades').delete().eq('user_id', userId);
      
      // Deletar vendas
      await supabase.from('vendas').delete().eq('user_id', userId);
      
      // Resetar pontos totais
      await supabase
        .from('profiles')
        .update({ pontos_totais: 0 })
        .eq('id', userId);

      toast.success(`Dados de ${userName} resetados com sucesso!`);
      await fetchUsers();
    } catch (error) {
      toast.error("Erro ao resetar dados do usuário");
      console.error(error);
    } finally {
      setResettingUserId(null);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Tem certeza que deseja DELETAR permanentemente o usuário ${userName}? Esta ação não pode ser desfeita!`)) {
      return;
    }

    try {
      // Primeiro limpa todos os dados relacionados
      await supabase.from('progresso_metas').delete().eq('user_id', userId);
      await supabase.from('user_conquistas').delete().eq('user_id', userId);
      await supabase.from('registros_ponto').delete().eq('user_id', userId);
      await supabase.from('atividades').delete().eq('user_id', userId);
      await supabase.from('vendas').delete().eq('user_id', userId);
      await supabase.from('user_roles').delete().eq('user_id', userId);
      await supabase.from('notificacoes').delete().eq('user_id', userId);
      await supabase.from('profiles').delete().eq('id', userId);

      toast.success(`Usuário ${userName} deletado com sucesso!`);
      await fetchUsers();
    } catch (error) {
      toast.error("Erro ao deletar usuário");
      console.error(error);
    }
  };

  const openEditDialog = (u: UserProfile) => {
    setEditingUser(u);
    setEditNome(u.nome);
    setEditEmail(u.email);
    setEditTelefone(u.telefone || "");
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    const trimmedNome = editNome.trim();
    const trimmedEmail = editEmail.trim();
    const trimmedTelefone = editTelefone.trim();

    if (!trimmedNome || !trimmedEmail) {
      toast.error("Nome e email são obrigatórios");
      return;
    }

    // Input validation - length limits
    if (trimmedNome.length > 150) {
      toast.error("Nome muito longo (máx 150 caracteres)");
      return;
    }

    if (trimmedEmail.length > 255) {
      toast.error("Email muito longo (máx 255 caracteres)");
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast.error("Formato de email inválido");
      return;
    }

    // Phone validation
    if (trimmedTelefone && trimmedTelefone.length > 20) {
      toast.error("Telefone muito longo (máx 20 caracteres)");
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          nome: trimmedNome,
          email: trimmedEmail,
          telefone: trimmedTelefone || null,
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      toast.success(`Dados de ${editNome} atualizados com sucesso!`);
      setEditDialogOpen(false);
      await fetchUsers();
    } catch (error) {
      toast.error("Erro ao atualizar usuário");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('pt-BR'),
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-primary">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-primary pb-24">
      <Header title="Painel Admin" subtitle="Gerenciamento" showLogout={false} />
      
      <div className="p-6 space-y-6 animate-fade-in">
        <Card className="p-6 bg-card/95 backdrop-blur border-white/10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-gold" />
              <h2 className="text-xl font-bold text-foreground">Administrador</h2>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                signOut();
                navigate("/login");
              }}
              className="h-10 rounded-xl"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>

          <Tabs defaultValue="users" className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="users" className="rounded-xl">
                <Users className="h-4 w-4 mr-2" />
                Usuários
              </TabsTrigger>
              <TabsTrigger value="metas" className="rounded-xl">
                <Target className="h-4 w-4 mr-2" />
                Metas
              </TabsTrigger>
              <TabsTrigger value="reunioes" className="rounded-xl">
                <Video className="h-4 w-4 mr-2" />
                Reuniões
              </TabsTrigger>
              <TabsTrigger value="ponto" className="rounded-xl">
                <Clock className="h-4 w-4 mr-2" />
                Ponto
              </TabsTrigger>
              <TabsTrigger value="config" className="rounded-xl">
                <Settings className="h-4 w-4 mr-2" />
                Config
              </TabsTrigger>
            </TabsList>

            {/* Tab de Usuários */}
            <TabsContent value="users" className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="search" className="text-foreground flex items-center gap-2 mb-2">
                    <Search className="h-4 w-4" />
                    Buscar usuário
                  </Label>
                  <Input
                    id="search"
                    type="text"
                    placeholder="Nome ou e-mail..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-12 rounded-xl"
                  />
                </div>
              </div>

              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                {filteredUsers.length} usuário(s) encontrado(s)
              </p>
            </TabsContent>

            {/* Tab de Metas */}
            <TabsContent value="metas" className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  {metas.length} meta(s) cadastrada(s)
                </p>
                <Button
                  onClick={() => openMetaDialog()}
                  className="h-10 rounded-xl bg-gold hover:bg-gold/90 text-gold-foreground"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Meta
                </Button>
              </div>
            </TabsContent>

            {/* Tab de Reuniões */}
            <TabsContent value="reunioes" className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  {reunioes.length} reunião(ões) cadastrada(s)
                </p>
                <Button
                  onClick={() => openReuniaoDialog()}
                  className="h-10 rounded-xl bg-gold hover:bg-gold/90 text-gold-foreground"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Reunião
                </Button>
              </div>
            </TabsContent>

            {/* Tab de Ponto */}
            <TabsContent value="ponto" className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="ponto-search" className="text-foreground flex items-center gap-2 mb-2">
                    <Search className="h-4 w-4" />
                    Buscar por usuário
                  </Label>
                  <Input
                    id="ponto-search"
                    type="text"
                    placeholder="Nome ou e-mail..."
                    value={pontoSearchTerm}
                    onChange={(e) => setPontoSearchTerm(e.target.value)}
                    className="h-12 rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="ponto-data" className="text-foreground flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4" />
                    Filtrar por data
                  </Label>
                  <Input
                    id="ponto-data"
                    type="date"
                    value={pontoDataFiltro}
                    onChange={(e) => setPontoDataFiltro(e.target.value)}
                    className="h-12 rounded-xl"
                  />
                </div>
              </div>

              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {registrosPonto.filter(r => {
                  const matchesSearch = !pontoSearchTerm || 
                    r.user_nome?.toLowerCase().includes(pontoSearchTerm.toLowerCase()) ||
                    r.user_email?.toLowerCase().includes(pontoSearchTerm.toLowerCase());
                  const matchesDate = !pontoDataFiltro || 
                    new Date(r.entrada).toISOString().split('T')[0] === pontoDataFiltro;
                  return matchesSearch && matchesDate;
                }).length} registro(s) encontrado(s)
              </p>
            </TabsContent>

            {/* Tab de Configurações */}
            <TabsContent value="config" className="space-y-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Personalização da Tela de Login</h3>
                    <p className="text-sm text-muted-foreground">Configure o logo e fundo da tela de login</p>
                  </div>
                  <Button
                    onClick={() => setLoginSettingsOpen(true)}
                    className="h-10 rounded-xl bg-gold hover:bg-gold/90 text-gold-foreground"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Configurar
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Lista de Usuários */}
        <div className="space-y-4">
          {filteredUsers.map((u) => (
            <Card key={u.id} className="p-6 bg-card/95 backdrop-blur border-white/10 animate-slide-up">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-foreground">{u.nome}</h3>
                    {u.is_admin && (
                      <span className="text-xs px-2 py-1 rounded-full bg-gold/20 text-gold flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{u.email}</p>
                  {u.telefone && (
                    <p className="text-sm text-muted-foreground">{u.telefone}</p>
                  )}
                  <p className="text-sm font-medium text-gold mt-2">
                    {u.pontos_totais} pontos
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleToggleAdmin(u.id, u.nome, u.is_admin || false)}
                    className={`h-10 rounded-xl ${u.is_admin ? 'border-orange-500/30 hover:bg-orange-500/10' : 'border-green-500/30 hover:bg-green-500/10'}`}
                  >
                    <UserCog className="h-4 w-4 mr-2" />
                    {u.is_admin ? 'Remover Admin' : 'Tornar Admin'}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => openEditDialog(u)}
                    className="h-10 rounded-xl border-blue-500/30 hover:bg-blue-500/10"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => handleResetUser(u.id, u.nome)}
                    disabled={resettingUserId === u.id}
                    className="h-10 rounded-xl border-gold/30 hover:bg-gold/10"
                  >
                    {resettingUserId === u.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Limpar Dados
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteUser(u.id, u.nome)}
                    className="h-10 rounded-xl"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Deletar
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {filteredUsers.length === 0 && (
            <Card className="p-12 bg-card/95 backdrop-blur border-white/10 text-center">
              <p className="text-muted-foreground">Nenhum usuário encontrado</p>
            </Card>
          )}
        </div>

        {/* Lista de Metas */}
        <div className="space-y-4">
          {metas.map((meta) => (
            <Card key={meta.id} className="p-6 bg-card/95 backdrop-blur border-white/10 animate-slide-up">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-foreground">{meta.titulo}</h3>
                    {meta.ativo ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">Ativa</span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-500/20 text-gray-400">Inativa</span>
                    )}
                    {meta.tipo_meta === 'recorrente' ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">Contínua</span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-400">Única</span>
                    )}
                  </div>
                  {meta.descricao && (
                    <p className="text-sm text-muted-foreground mb-2">{meta.descricao}</p>
                  )}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">Tipo:</span> {meta.tipo}
                    </p>
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">Período:</span> {meta.periodo}
                    </p>
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">Objetivo:</span> {meta.valor_objetivo}
                    </p>
                    <p className="text-gold font-medium">
                      {meta.pontos_recompensa} pontos
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => openMetaDialog(meta)}
                    className="h-10 rounded-xl border-blue-500/30 hover:bg-blue-500/10"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>

                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteMeta(meta.id, meta.titulo)}
                    className="h-10 rounded-xl"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Deletar
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {metas.length === 0 && (
            <Card className="p-12 bg-card/95 backdrop-blur border-white/10 text-center">
              <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhuma meta cadastrada</p>
              <Button
                onClick={() => openMetaDialog()}
                className="mt-4 h-10 rounded-xl bg-gold hover:bg-gold/90 text-gold-foreground"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Meta
              </Button>
            </Card>
          )}
        </div>

        {/* Lista de Reuniões */}
        <div className="space-y-4">
          {reunioes.map((reuniao) => {
            const { date, time } = formatDateTime(reuniao.data_hora);
            const isPast = new Date(reuniao.data_hora) < new Date();
            const isCanceled = reuniao.status === 'cancelada';

            return (
              <Card key={reuniao.id} className={`p-6 bg-card/95 backdrop-blur border-white/10 animate-slide-up ${isCanceled ? 'opacity-60' : ''}`}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Video className="h-5 w-5 text-gold" />
                      <h3 className="text-lg font-semibold text-foreground">{reuniao.titulo}</h3>
                      {isCanceled ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400">Cancelada</span>
                      ) : isPast ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-500/20 text-gray-400">Encerrada</span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">Agendada</span>
                      )}
                    </div>
                    {reuniao.descricao && (
                      <p className="text-sm text-muted-foreground mb-2">{reuniao.descricao}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm">
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {date} às {time}
                      </p>
                      {reuniao.link && (
                        <a 
                          href={reuniao.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-gold hover:underline flex items-center gap-1"
                        >
                          <Link className="h-4 w-4" />
                          Acessar reunião
                        </a>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {!isCanceled && !isPast && (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => openReuniaoDialog(reuniao)}
                          className="h-10 rounded-xl border-blue-500/30 hover:bg-blue-500/10"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => handleCancelReuniao(reuniao.id, reuniao.titulo)}
                          className="h-10 rounded-xl border-orange-500/30 hover:bg-orange-500/10"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancelar
                        </Button>
                      </>
                    )}

                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteReuniao(reuniao.id, reuniao.titulo)}
                      className="h-10 rounded-xl"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Deletar
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}

          {reunioes.length === 0 && (
            <Card className="p-12 bg-card/95 backdrop-blur border-white/10 text-center">
              <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhuma reunião cadastrada</p>
              <Button
                onClick={() => openReuniaoDialog()}
                className="mt-4 h-10 rounded-xl bg-gold hover:bg-gold/90 text-gold-foreground"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agendar Primeira Reunião
              </Button>
            </Card>
          )}
        </div>

        {/* Lista de Registros de Ponto */}
        <div className="space-y-4">
          {registrosPonto
            .filter(r => {
              const matchesSearch = !pontoSearchTerm || 
                r.user_nome?.toLowerCase().includes(pontoSearchTerm.toLowerCase()) ||
                r.user_email?.toLowerCase().includes(pontoSearchTerm.toLowerCase());
              const matchesDate = !pontoDataFiltro || 
                new Date(r.entrada).toISOString().split('T')[0] === pontoDataFiltro;
              return matchesSearch && matchesDate;
            })
            .map((registro) => {
              const entradaDate = new Date(registro.entrada);
              const saidaDate = registro.saida ? new Date(registro.saida) : null;
              
              const formatTime = (date: Date) => date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
              const formatDate = (date: Date) => date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", weekday: "short" });

              return (
                <Card key={registro.id} className="p-6 bg-card/95 backdrop-blur border-white/10 animate-slide-up">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-5 w-5 text-gold" />
                        <h3 className="text-lg font-semibold text-foreground">{registro.user_nome}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{registro.user_email}</p>
                      <p className="text-sm text-muted-foreground mb-3">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        {formatDate(entradaDate)}
                      </p>
                      
                      <div className="flex gap-6">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <div>
                            <p className="text-xs text-muted-foreground">Entrada</p>
                            <p className="text-sm font-semibold text-foreground">{formatTime(entradaDate)}</p>
                          </div>
                        </div>
                        
                        {saidaDate ? (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            <div>
                              <p className="text-xs text-muted-foreground">Saída</p>
                              <p className="text-sm font-semibold text-foreground">{formatTime(saidaDate)}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 opacity-50">
                            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                            <div>
                              <p className="text-xs text-muted-foreground">Saída</p>
                              <p className="text-sm text-muted-foreground">Não registrada</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}

          {registrosPonto.filter(r => {
            const matchesSearch = !pontoSearchTerm || 
              r.user_nome?.toLowerCase().includes(pontoSearchTerm.toLowerCase()) ||
              r.user_email?.toLowerCase().includes(pontoSearchTerm.toLowerCase());
            const matchesDate = !pontoDataFiltro || 
              new Date(r.entrada).toISOString().split('T')[0] === pontoDataFiltro;
            return matchesSearch && matchesDate;
          }).length === 0 && (
            <Card className="p-12 bg-card/95 backdrop-blur border-white/10 text-center">
              <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhum registro de ponto encontrado</p>
            </Card>
          )}
        </div>

        {/* Dialog de Edição de Usuário */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="bg-card border-white/10">
            <DialogHeader>
              <DialogTitle className="text-foreground">Editar Usuário</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Altere os dados do usuário abaixo.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nome" className="text-foreground">Nome</Label>
                <Input
                  id="edit-nome"
                  value={editNome}
                  onChange={(e) => setEditNome(e.target.value)}
                  placeholder="Nome completo"
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email" className="text-foreground">E-mail</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-telefone" className="text-foreground">Telefone (Opcional)</Label>
                <Input
                  id="edit-telefone"
                  type="tel"
                  value={editTelefone}
                  onChange={(e) => setEditTelefone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="h-11 rounded-xl"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                className="flex-1 h-11 rounded-xl"
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveEdit}
                className="flex-1 h-11 rounded-xl bg-gold hover:bg-gold/90 text-gold-foreground"
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Salvar"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de Metas */}
        <Dialog open={metaDialogOpen} onOpenChange={setMetaDialogOpen}>
          <DialogContent className="bg-card border-white/10 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {editingMeta ? "Editar Meta" : "Nova Meta"}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {editingMeta ? "Altere os dados da meta abaixo." : "Preencha os dados para criar uma nova meta."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="meta-titulo" className="text-foreground">Título *</Label>
                <Input
                  id="meta-titulo"
                  value={metaTitulo}
                  onChange={(e) => setMetaTitulo(e.target.value)}
                  placeholder="Ex: Realizar 10 visitas"
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta-descricao" className="text-foreground">Descrição</Label>
                <Textarea
                  id="meta-descricao"
                  value={metaDescricao}
                  onChange={(e) => setMetaDescricao(e.target.value)}
                  placeholder="Descrição detalhada da meta (opcional)"
                  className="rounded-xl min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="meta-tipo" className="text-foreground">Tipo *</Label>
                  <Select value={metaTipo} onValueChange={setMetaTipo}>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vendas">Vendas</SelectItem>
                      <SelectItem value="visitas">Visitas</SelectItem>
                      <SelectItem value="reunioes">Reuniões</SelectItem>
                      <SelectItem value="leads">Leads</SelectItem>
                      <SelectItem value="pontos">Pontos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meta-periodo" className="text-foreground">Período *</Label>
                  <Select value={metaPeriodo} onValueChange={setMetaPeriodo}>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diario">Diário</SelectItem>
                      <SelectItem value="semanal">Semanal</SelectItem>
                      <SelectItem value="mensal">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta-tipo-meta" className="text-foreground">Tipo de Meta *</Label>
                <Select value={metaTipoMeta} onValueChange={(v: 'unica' | 'recorrente') => setMetaTipoMeta(v)}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unica">Única (pode ser concluída apenas uma vez)</SelectItem>
                    <SelectItem value="recorrente">Contínua (pode ser concluída várias vezes)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="meta-valor" className="text-foreground">Valor Objetivo *</Label>
                  <Input
                    id="meta-valor"
                    type="number"
                    min="1"
                    value={metaValorObjetivo}
                    onChange={(e) => setMetaValorObjetivo(e.target.value)}
                    placeholder="Ex: 10"
                    className="h-11 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meta-pontos" className="text-foreground">Pontos Recompensa *</Label>
                  <Input
                    id="meta-pontos"
                    type="number"
                    min="1"
                    value={metaPontosRecompensa}
                    onChange={(e) => setMetaPontosRecompensa(e.target.value)}
                    placeholder="Ex: 50"
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="meta-ativo"
                  checked={metaAtivo}
                  onChange={(e) => setMetaAtivo(e.target.checked)}
                  className="h-4 w-4 rounded"
                />
                <Label htmlFor="meta-ativo" className="text-foreground cursor-pointer">
                  Meta ativa
                </Label>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setMetaDialogOpen(false)}
                className="flex-1 h-11 rounded-xl"
                disabled={savingMeta}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveMeta}
                className="flex-1 h-11 rounded-xl bg-gold hover:bg-gold/90 text-gold-foreground"
                disabled={savingMeta}
              >
                {savingMeta ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Salvar"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de Reuniões */}
        <Dialog open={reuniaoDialogOpen} onOpenChange={setReuniaoDialogOpen}>
          <DialogContent className="bg-card border-white/10 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {editingReuniao ? "Editar Reunião" : "Nova Reunião"}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {editingReuniao ? "Altere os dados da reunião abaixo." : "Preencha os dados para agendar uma nova reunião. Todos os corretores serão notificados."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="reuniao-titulo" className="text-foreground">Título/Tema *</Label>
                <Input
                  id="reuniao-titulo"
                  value={reuniaoTitulo}
                  onChange={(e) => setReuniaoTitulo(e.target.value)}
                  placeholder="Ex: Reunião de Alinhamento Semanal"
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reuniao-descricao" className="text-foreground">Descrição</Label>
                <Textarea
                  id="reuniao-descricao"
                  value={reuniaoDescricao}
                  onChange={(e) => setReuniaoDescricao(e.target.value)}
                  placeholder="Descrição detalhada da reunião (opcional)"
                  className="rounded-xl min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reuniao-link" className="text-foreground">Link da Reunião</Label>
                <Input
                  id="reuniao-link"
                  value={reuniaoLink}
                  onChange={(e) => setReuniaoLink(e.target.value)}
                  placeholder="Ex: https://meet.google.com/xxx-xxxx-xxx"
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reuniao-data" className="text-foreground">Data *</Label>
                  <Input
                    id="reuniao-data"
                    type="date"
                    value={reuniaoData}
                    onChange={(e) => setReuniaoData(e.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reuniao-hora" className="text-foreground">Hora *</Label>
                  <Input
                    id="reuniao-hora"
                    type="time"
                    value={reuniaoHora}
                    onChange={(e) => setReuniaoHora(e.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setReuniaoDialogOpen(false)}
                className="flex-1 h-11 rounded-xl"
                disabled={savingReuniao}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveReuniao}
                className="flex-1 h-11 rounded-xl bg-gold hover:bg-gold/90 text-gold-foreground"
                disabled={savingReuniao}
              >
                {savingReuniao ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Salvar"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de Configurações de Login */}
        <LoginSettingsDialog
          open={loginSettingsOpen}
          onOpenChange={setLoginSettingsOpen}
        />
      </div>
    </div>
  );
};

export default Admin;
