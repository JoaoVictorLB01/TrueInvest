import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Mail, Award, TrendingUp, Calendar, Clock, Loader2, Upload, Bell, Check, Video, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  nome: string;
  email: string;
  foto: string | null;
  pontos_totais: number;
}

interface Notificacao {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string | null;
  referencia_id: string | null;
  lida: boolean;
  created_at: string;
}

const Perfil = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [ranking, setRanking] = useState<number | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editNome, setEditNome] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [uploading, setUploading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  
  // Notificações
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loadingNotificacoes, setLoadingNotificacoes] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }
    if (user) {
      fetchProfile();
      fetchNotificacoes();
    }
  }, [user, authLoading, navigate]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileData) {
      setProfile(profileData);
    }

    // Calculate ranking
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('id, pontos_totais')
      .order('pontos_totais', { ascending: false });

    if (allProfiles) {
      const userRanking = allProfiles.findIndex(p => p.id === user.id) + 1;
      setRanking(userRanking > 0 ? userRanking : null);
    }

    setLoading(false);
  };

  const fetchNotificacoes = async () => {
    if (!user) return;
    
    setLoadingNotificacoes(true);
    const { data, error } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar notificações:', error);
    } else {
      setNotificacoes(data || []);
    }
    setLoadingNotificacoes(false);
  };

  const handleMarcarLida = async (notificacaoId: string) => {
    const { error } = await supabase
      .from('notificacoes')
      .update({ lida: true })
      .eq('id', notificacaoId);

    if (error) {
      toast.error("Erro ao marcar notificação como lida");
    } else {
      setNotificacoes(prev => 
        prev.map(n => n.id === notificacaoId ? { ...n, lida: true } : n)
      );
    }
  };

  const handleLogout = async () => {
    await signOut();
    toast.success("Logout realizado com sucesso!");
    navigate("/login");
  };

  const openEditDialog = () => {
    if (profile) {
      setEditNome(profile.nome);
      setEditEmail(profile.email);
      setPhotoFile(null);
      setIsEditDialogOpen(true);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoFile(e.target.files[0]);
    }
  };

  const handleSaveEdit = async () => {
    if (!user || !profile) return;

    setUploading(true);
    try {
      let photoUrl = profile.foto;

      // Upload photo if selected
      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, photoFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        photoUrl = publicUrl;
      }

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          nome: editNome,
          email: editEmail,
          foto: photoUrl,
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Refresh profile data
      await fetchProfile();
      
      toast.success("Perfil atualizado com sucesso!");
      setIsEditDialogOpen(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || "Erro ao atualizar perfil");
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const notificacoesNaoLidas = notificacoes.filter(n => !n.lida);
  const historicoNotificacoes = notificacoes.filter(n => n.lida);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!profile) return null;

  const estatisticas = [
    { label: "Pontos Totais", value: profile.pontos_totais.toLocaleString(), icon: Award, color: "text-gold" },
    { label: "Posição Ranking", value: ranking ? `${ranking}º` : "-", icon: TrendingUp, color: "text-gold" },
    { label: "Reuniões Mês", value: "12", icon: Calendar, color: "text-primary" },
    { label: "Dias Ativos", value: "87", icon: Clock, color: "text-success" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header 
        title="Meu Perfil"
        subtitle="Suas informações e estatísticas"
      />

      <div className="p-6 space-y-6 -mt-6">
        {/* Card do Perfil */}
        <Card className="p-6 gradient-card border-0 shadow-lg animate-fade-in">
          <div className="flex flex-col items-center text-center">
            <Avatar className="h-24 w-24 mb-4 border-4 border-gold shadow-gold">
              <AvatarImage src={profile.foto || undefined} />
              <AvatarFallback className="text-2xl">{profile.nome[0]}</AvatarFallback>
            </Avatar>
            
            <h2 className="text-2xl font-bold text-foreground mb-1">{profile.nome}</h2>
            
            <div className="flex items-center gap-2 text-muted-foreground mb-4">
              <Mail className="h-4 w-4" />
              <span className="text-sm">{profile.email}</span>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 rounded-full">
              <Award className="h-4 w-4 text-gold" />
              <span className="text-sm font-semibold text-gold">
                {profile.pontos_totais < 1000 ? 'Nível Iniciante' : profile.pontos_totais < 3000 ? 'Nível Avançado' : 'Nível Expert'}
              </span>
            </div>
          </div>
        </Card>

        {/* Estatísticas */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Estatísticas</h3>
          <div className="grid grid-cols-2 gap-4">
            {estatisticas.map((stat, index) => (
              <Card 
                key={index}
                className="p-4 gradient-card border-0 shadow-md animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <stat.icon className={`h-6 w-6 ${stat.color} mb-2`} />
                <p className="text-2xl font-bold text-foreground mb-1">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Notificações */}
        <Card className="p-6 gradient-card border-0 shadow-md animate-slide-up" style={{ animationDelay: "0.4s" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificações
              {notificacoesNaoLidas.length > 0 && (
                <span className="text-xs px-2 py-1 rounded-full bg-gold/20 text-gold">
                  {notificacoesNaoLidas.length} nova(s)
                </span>
              )}
            </h3>
          </div>

          <Tabs defaultValue="novas" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="novas" className="rounded-xl text-sm">
                Novas ({notificacoesNaoLidas.length})
              </TabsTrigger>
              <TabsTrigger value="historico" className="rounded-xl text-sm">
                Histórico ({historicoNotificacoes.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="novas" className="space-y-3">
              {loadingNotificacoes ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-gold" />
                </div>
              ) : notificacoesNaoLidas.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma notificação nova
                </p>
              ) : (
                notificacoesNaoLidas.map((notif) => (
                  <div key={notif.id} className="p-3 bg-gold/10 rounded-xl border border-gold/20">
                    <div className="flex items-start gap-3">
                      {notif.tipo === 'reuniao' || notif.tipo === 'reuniao_cancelada' ? (
                        <Video className={`h-5 w-5 mt-0.5 ${notif.tipo === 'reuniao_cancelada' ? 'text-red-400' : 'text-gold'}`} />
                      ) : (
                        <Bell className="h-5 w-5 text-gold mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-sm text-foreground">{notif.titulo}</p>
                        {notif.mensagem && (
                          <p className="text-xs text-muted-foreground mt-1">{notif.mensagem}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">{formatDate(notif.created_at)}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMarcarLida(notif.id)}
                        className="h-8 px-2 text-gold hover:text-gold hover:bg-gold/20"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Conferir
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="historico" className="space-y-3 max-h-64 overflow-y-auto">
              {historicoNotificacoes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma notificação no histórico
                </p>
              ) : (
                historicoNotificacoes.map((notif) => (
                  <div key={notif.id} className="p-3 bg-muted/30 rounded-xl opacity-70">
                    <div className="flex items-start gap-3">
                      {notif.tipo === 'reuniao' || notif.tipo === 'reuniao_cancelada' ? (
                        <Video className={`h-5 w-5 mt-0.5 ${notif.tipo === 'reuniao_cancelada' ? 'text-red-400' : 'text-muted-foreground'}`} />
                      ) : (
                        <Bell className="h-5 w-5 text-muted-foreground mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-sm text-foreground">{notif.titulo}</p>
                        {notif.mensagem && (
                          <p className="text-xs text-muted-foreground mt-1">{notif.mensagem}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">{formatDate(notif.created_at)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </Card>

        {/* Conquistas Recentes */}
        <Card className="p-6 gradient-card border-0 shadow-md animate-slide-up" style={{ animationDelay: "0.5s" }}>
          <h3 className="font-semibold text-foreground mb-4">Conquistas Recentes</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gold/10 rounded-xl">
              <Award className="h-8 w-8 text-gold" />
              <div>
                <p className="font-medium text-sm text-foreground">Vendedor Estrela</p>
                <p className="text-xs text-muted-foreground">Conquistado há 2 dias</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-success/10 rounded-xl">
              <Award className="h-8 w-8 text-success" />
              <div>
                <p className="font-medium text-sm text-foreground">Pontual</p>
                <p className="text-xs text-muted-foreground">Conquistado há 1 semana</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Configurações */}
        <Card className="p-4 gradient-card border-0 shadow-md animate-slide-up" style={{ animationDelay: "0.6s" }}>
          <h3 className="font-semibold text-foreground mb-3 px-2">Configurações</h3>
          <div className="space-y-2">
            <button 
              onClick={openEditDialog}
              className="w-full text-left px-3 py-3 hover:bg-muted/30 rounded-xl transition-smooth text-sm text-foreground"
            >
              Editar Perfil
            </button>
            <button className="w-full text-left px-3 py-3 hover:bg-muted/30 rounded-xl transition-smooth text-sm text-foreground">
              Privacidade
            </button>
            <button className="w-full text-left px-3 py-3 hover:bg-muted/30 rounded-xl transition-smooth text-sm text-foreground">
              Ajuda e Suporte
            </button>
          </div>
        </Card>

        {/* Botão de Logout */}
        <Button
          onClick={handleLogout}
          variant="destructive"
          className="w-full h-12 rounded-xl font-semibold animate-scale-in"
          style={{ animationDelay: "0.7s" }}
        >
          <LogOut className="mr-2 h-5 w-5" />
          Sair da Conta
        </Button>
      </div>

      <BottomNav />

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nome">Nome</Label>
              <Input
                id="edit-nome"
                value={editNome}
                onChange={(e) => setEditNome(e.target.value)}
                placeholder="Seu nome"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">E-mail</Label>
              <Input
                id="edit-email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="seu@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-photo">Foto de Perfil</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="edit-photo"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handlePhotoChange}
                  className="flex-1"
                />
                <Upload className="h-5 w-5 text-muted-foreground" />
              </div>
              {photoFile && (
                <p className="text-xs text-muted-foreground">
                  Arquivo selecionado: {photoFile.name}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="flex-1"
              disabled={uploading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveEdit}
              className="flex-1"
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Perfil;
