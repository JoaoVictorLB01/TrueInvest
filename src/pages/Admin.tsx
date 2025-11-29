import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Shield, Trash2, Users, LogOut, Search, Edit, Target, Plus } from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";

interface UserProfile {
  id: string;
  nome: string;
  email: string;
  pontos_totais: number;
  telefone?: string;
}

interface Meta {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: string;
  valor_objetivo: number;
  pontos_recompensa: number;
  periodo: string;
  ativo: boolean | null;
  created_at: string | null;
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
  const [metaAtivo, setMetaAtivo] = useState(true);
  const [savingMeta, setSavingMeta] = useState(false);

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
    setLoading(false);
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nome, email, pontos_totais, telefone')
      .order('nome');

    if (error) {
      toast.error("Erro ao carregar usuários");
      return;
    }

    setUsers(data || []);
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

    setMetas(data || []);
  };

  const openMetaDialog = (meta?: Meta) => {
    if (meta) {
      setEditingMeta(meta);
      setMetaTitulo(meta.titulo);
      setMetaDescricao(meta.descricao || "");
      setMetaTipo(meta.tipo);
      setMetaValorObjetivo(String(meta.valor_objetivo));
      setMetaPontosRecompensa(String(meta.pontos_recompensa));
      setMetaPeriodo(meta.periodo);
      setMetaAtivo(meta.ativo ?? true);
    } else {
      setEditingMeta(null);
      setMetaTitulo("");
      setMetaDescricao("");
      setMetaTipo("vendas");
      setMetaValorObjetivo("");
      setMetaPontosRecompensa("");
      setMetaPeriodo("mensal");
      setMetaAtivo(true);
    }
    setMetaDialogOpen(true);
  };

  const handleSaveMeta = async () => {
    if (!metaTitulo.trim()) {
      toast.error("Título é obrigatório");
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

    if (!editNome.trim() || !editEmail.trim()) {
      toast.error("Nome e email são obrigatórios");
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          nome: editNome.trim(),
          email: editEmail.trim(),
          telefone: editTelefone.trim() || null,
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
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="users" className="rounded-xl">
                <Users className="h-4 w-4 mr-2" />
                Usuários
              </TabsTrigger>
              <TabsTrigger value="metas" className="rounded-xl">
                <Target className="h-4 w-4 mr-2" />
                Metas
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
          </Tabs>
        </Card>

        {/* Lista de Usuários */}
        <div className="space-y-4">
          {filteredUsers.map((u) => (
            <Card key={u.id} className="p-6 bg-card/95 backdrop-blur border-white/10 animate-slide-up">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground">{u.nome}</h3>
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

        {/* Dialog de Edição */}
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
      </div>
    </div>
  );
};

export default Admin;
