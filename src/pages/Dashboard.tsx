import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { TrendingUp, Target, Calendar, Award, Clock, CheckCircle2, Loader2, Video, Link, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  nome: string;
  email: string;
  foto: string | null;
  pontos_totais: number;
}

interface Reuniao {
  id: string;
  titulo: string;
  descricao: string | null;
  link: string | null;
  data_hora: string;
  status: string | null;
}

interface Atividade {
  id: string;
  titulo: string;
  descricao: string | null;
  data_hora: string;
  tipo: string;
  status: string | null;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pontoStatus, setPontoStatus] = useState<"entrada" | "saida" | null>(null);
  const [loading, setLoading] = useState(true);
  const [proximasReunioes, setProximasReunioes] = useState<Reuniao[]>([]);
  const [proximasAtividades, setProximasAtividades] = useState<Atividade[]>([]);
  const [notificacoesCount, setNotificacoesCount] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }

    if (user) {
      fetchProfile();
      checkPontoStatus();
      fetchProximasReunioes();
      fetchProximasAtividades();
      fetchNotificacoesCount();
    }
  }, [user, authLoading, navigate]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
    } else if (data) {
      setProfile(data);
    }
    setLoading(false);
  };

  const checkPontoStatus = async () => {
    if (!user) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data, error } = await supabase
      .from('registros_ponto')
      .select('*')
      .eq('user_id', user.id)
      .gte('entrada', today.toISOString())
      .maybeSingle();

    if (error) {
      console.error('Error checking ponto:', error);
    } else if (data) {
      setPontoStatus(data.saida ? null : "saida");
    } else {
      setPontoStatus("entrada");
    }
  };

  const fetchProximasReunioes = async () => {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('reunioes')
      .select('*')
      .eq('status', 'agendada')
      .gte('data_hora', now)
      .order('data_hora', { ascending: true })
      .limit(5);

    if (error) {
      console.error('Error fetching reunioes:', error);
    } else {
      setProximasReunioes(data || []);
    }
  };

  const fetchProximasAtividades = async () => {
    if (!user) return;
    
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('atividades')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'agendada')
      .gte('data_hora', now)
      .order('data_hora', { ascending: true })
      .limit(5);

    if (error) {
      console.error('Error fetching atividades:', error);
    } else {
      setProximasAtividades(data || []);
    }
  };

  const fetchNotificacoesCount = async () => {
    if (!user) return;
    
    const { count, error } = await supabase
      .from('notificacoes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('lida', false);

    if (!error && count !== null) {
      setNotificacoesCount(count);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      weekday: date.toLocaleDateString('pt-BR', { weekday: 'short' })
    };
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!profile) return null;

  const stats = [
    { label: "Pontos", value: profile.pontos_totais.toLocaleString(), icon: Award, color: "text-gold" },
    { label: "Posição", value: "—", icon: TrendingUp, color: "text-gold" },
    { label: "Reuniões", value: String(proximasReunioes.length), icon: Calendar, color: "text-primary" },
    { label: "Vendas", value: "0", icon: CheckCircle2, color: "text-success" },
  ];

  const todasAtividades = [
    ...proximasReunioes.map(r => ({ ...r, tipoItem: 'reuniao' as const })),
    ...proximasAtividades.map(a => ({ ...a, tipoItem: 'atividade' as const }))
  ].sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime()).slice(0, 5);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header 
        title={`Olá, ${profile.nome.split(' ')[0]}!`}
        subtitle="Seja bem-vindo de volta"
        showLogout
      />

      <div className="p-6 space-y-6 -mt-6">
        {/* Notificações Badge */}
        {notificacoesCount > 0 && (
          <Card 
            onClick={() => navigate('/perfil')}
            className="p-4 gradient-card border-0 shadow-md cursor-pointer hover:bg-gold/5 transition-colors animate-fade-in"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gold/20 rounded-xl flex items-center justify-center">
                <Bell className="h-5 w-5 text-gold" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Você tem {notificacoesCount} notificação(ões) nova(s)</p>
                <p className="text-xs text-muted-foreground">Toque para ver</p>
              </div>
            </div>
          </Card>
        )}

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, index) => (
            <Card 
              key={index}
              className="p-4 gradient-card border-0 shadow-md card-interactive hover-glow opacity-0-animate animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="icon-bounce">
                <stat.icon className={`h-8 w-8 ${stat.color} mb-2 transition-transform duration-300`} />
              </div>
              <p className="text-2xl font-bold text-foreground mb-1">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </Card>
          ))}
        </div>

        {/* Botão de Ponto */}
        <Card className="p-6 gradient-card border-0 shadow-lg opacity-0-animate animate-slide-up delay-300 card-interactive">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center animate-pulse-soft">
              <Clock className="h-6 w-6 text-gold" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Registro de Ponto</h3>
              <p className="text-sm text-muted-foreground">
                {pontoStatus === "entrada" ? "Marcar entrada" : pontoStatus === "saida" ? "Marcar saída" : "Ponto completo hoje"}
              </p>
            </div>
          </div>
          
          {pontoStatus && (
            <Button 
              onClick={() => navigate("/ponto")}
              className="w-full h-12 bg-gold hover:bg-gold/90 text-gold-foreground font-semibold rounded-xl shadow-gold hover-lift press-effect animate-glow"
            >
              Marcar {pontoStatus === "entrada" ? "Entrada" : "Saída"}
            </Button>
          )}
        </Card>

        {/* Progresso das Metas */}
        <Card className="p-6 gradient-card border-0 shadow-md opacity-0-animate animate-slide-up delay-400 card-interactive">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center icon-bounce">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Metas do Mês</h3>
          </div>

          <div className="space-y-4">
            <div className="opacity-0-animate animate-slide-left delay-500">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Reuniões</span>
                <span className="font-medium text-foreground">0/20</span>
              </div>
              <Progress value={0} className="h-2 progress-animated" />
            </div>

            <div className="opacity-0-animate animate-slide-left" style={{ animationDelay: '0.6s' }}>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Vendas</span>
                <span className="font-medium text-foreground">0/8</span>
              </div>
              <Progress value={0} className="h-2 progress-animated" />
            </div>

            <div className="opacity-0-animate animate-slide-left" style={{ animationDelay: '0.7s' }}>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Pontuação</span>
                <span className="font-medium text-foreground">{profile.pontos_totais.toLocaleString()}/4.000</span>
              </div>
              <Progress value={(profile.pontos_totais / 4000) * 100} className="h-2 progress-animated" />
            </div>
          </div>
        </Card>

        {/* Próximas Atividades */}
        <Card className="p-6 gradient-card border-0 shadow-md opacity-0-animate animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <h3 className="font-semibold text-foreground mb-4">Próximas Atividades</h3>
          
          {todasAtividades.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma atividade agendada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todasAtividades.map((item) => {
                const { date, time, weekday } = formatDateTime(item.data_hora);
                const isReuniao = item.tipoItem === 'reuniao';
                
                return (
                  <div 
                    key={item.id} 
                    className="flex items-start gap-3 p-3 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isReuniao ? 'bg-gold/20' : 'bg-primary/20'}`}>
                      {isReuniao ? (
                        <Video className="h-5 w-5 text-gold" />
                      ) : (
                        <Calendar className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{item.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {weekday}, {date} às {time}
                      </p>
                      {isReuniao && (item as Reuniao).link && (
                        <a 
                          href={(item as Reuniao).link!} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-gold hover:underline flex items-center gap-1 mt-1"
                        >
                          <Link className="h-3 w-3" />
                          Acessar reunião
                        </a>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`text-xs px-2 py-1 rounded-full ${isReuniao ? 'bg-gold/20 text-gold' : 'bg-primary/20 text-primary'}`}>
                        {isReuniao ? 'Reunião' : 'Atividade'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default Dashboard;
