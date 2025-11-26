import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { TrendingUp, Target, Calendar, Award, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface Corretor {
  id: string;
  nome: string;
  email: string;
  foto: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [corretor, setCorretor] = useState<Corretor | null>(null);
  const [pontoStatus, setPontoStatus] = useState<"entrada" | "saida" | null>(null);

  useEffect(() => {
    const corretorData = localStorage.getItem("corretor");
    if (!corretorData) {
      navigate("/login");
      return;
    }
    setCorretor(JSON.parse(corretorData));

    // Verificar status do ponto de hoje
    const pontoHoje = localStorage.getItem(`ponto-${new Date().toDateString()}`);
    if (pontoHoje) {
      const ponto = JSON.parse(pontoHoje);
      setPontoStatus(ponto.saida ? null : "saida");
    } else {
      setPontoStatus("entrada");
    }
  }, [navigate]);

  if (!corretor) return null;

  const stats = [
    { label: "Pontos", value: "2.450", icon: Award, color: "text-gold" },
    { label: "Posição", value: "3º", icon: TrendingUp, color: "text-gold" },
    { label: "Reuniões", value: "12", icon: Calendar, color: "text-primary" },
    { label: "Vendas", value: "5", icon: CheckCircle2, color: "text-success" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header 
        title={`Olá, ${corretor.nome.split(' ')[0]}!`}
        subtitle="Seja bem-vindo de volta"
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
                <span className="font-medium text-foreground">12/20</span>
              </div>
              <Progress value={60} className="h-2 progress-animated" />
            </div>

            <div className="opacity-0-animate animate-slide-left" style={{ animationDelay: '0.6s' }}>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Vendas</span>
                <span className="font-medium text-foreground">5/8</span>
              </div>
              <Progress value={62.5} className="h-2 progress-animated" />
            </div>

            <div className="opacity-0-animate animate-slide-left" style={{ animationDelay: '0.7s' }}>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Pontuação</span>
                <span className="font-medium text-foreground">2.450/4.000</span>
              </div>
              <Progress value={61.25} className="h-2 progress-animated" />
            </div>
          </div>
        </Card>

        {/* Próximas Atividades */}
        <Card className="p-6 gradient-card border-0 shadow-md opacity-0-animate animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <h3 className="font-semibold text-foreground mb-4">Próximas Atividades</h3>
          <div className="space-y-3">
            <div className="flex gap-3 p-3 bg-muted/30 rounded-xl hover-lift cursor-pointer opacity-0-animate animate-slide-right" style={{ animationDelay: '0.6s' }}>
              <div className="w-10 h-10 bg-gold/20 rounded-lg flex items-center justify-center flex-shrink-0 animate-float">
                <Calendar className="h-5 w-5 text-gold" />
              </div>
              <div>
                <p className="font-medium text-sm text-foreground">Reunião com Cliente</p>
                <p className="text-xs text-muted-foreground">Hoje às 14:00</p>
              </div>
            </div>

            <div className="flex gap-3 p-3 bg-muted/30 rounded-xl hover-lift cursor-pointer opacity-0-animate animate-slide-right" style={{ animationDelay: '0.7s' }}>
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0 animate-float" style={{ animationDelay: '0.5s' }}>
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm text-foreground">Visita ao Imóvel</p>
                <p className="text-xs text-muted-foreground">Amanhã às 10:00</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default Dashboard;
