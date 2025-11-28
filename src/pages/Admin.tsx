import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Shield, Trash2, Users, LogOut, Search, Edit } from "lucide-react";
import Header from "@/components/Header";
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
      <Header title="Painel Admin" subtitle="Gerenciamento de Usuários" showLogout={false} />
      
      <div className="p-6 space-y-6 animate-fade-in">
        <Card className="p-6 bg-card/95 backdrop-blur border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="h-6 w-6 text-gold" />
            <h2 className="text-xl font-bold text-foreground">Administrador</h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
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

          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              {filteredUsers.length} usuário(s) encontrado(s)
            </p>
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
        </Card>

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
      </div>
    </div>
  );
};

export default Admin;
