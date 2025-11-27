import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { TrendingUp, Target, Calendar, Award, Clock, CheckCircle2, Loader2 } from "lucide-react";
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

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pontoStatus, setPontoStatus] = useState<"entrada" | "saida" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }

    if (user) {
      fetchProfile();
      checkPontoStatus();
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
    { label: "Reuniões", value: "0", icon: Calendar, color: "text-primary" },
    { label: "Vendas", value: "0", icon: CheckCircle2, color: "text-success" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header 
        title={`Olá, ${profile.nome.split(' ')[0]}!`}
        subtitle="Seja bem-vindo de volta"
        showLogout
      />

      <div className="p-6 space-y-6 -mt-6">
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
          <div className="text-center py-6 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma atividade agendada</p>
          </div>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default Dashboard;
