import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Mail, Award, TrendingUp, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";

interface Corretor {
  id: string;
  nome: string;
  email: string;
  foto: string;
}

const Perfil = () => {
  const navigate = useNavigate();
  const [corretor, setCorretor] = useState<Corretor | null>(null);

  useEffect(() => {
    const corretorData = localStorage.getItem("corretor");
    if (!corretorData) {
      navigate("/login");
      return;
    }
    setCorretor(JSON.parse(corretorData));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("corretor");
    toast.success("Logout realizado com sucesso!");
    navigate("/login");
  };

  if (!corretor) return null;

  const estatisticas = [
    { label: "Pontos Totais", value: "2.450", icon: Award, color: "text-gold" },
    { label: "Posição Ranking", value: "3º", icon: TrendingUp, color: "text-gold" },
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
              <AvatarImage src={corretor.foto} />
              <AvatarFallback className="text-2xl">{corretor.nome[0]}</AvatarFallback>
            </Avatar>
            
            <h2 className="text-2xl font-bold text-foreground mb-1">{corretor.nome}</h2>
            
            <div className="flex items-center gap-2 text-muted-foreground mb-4">
              <Mail className="h-4 w-4" />
              <span className="text-sm">{corretor.email}</span>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 rounded-full">
              <Award className="h-4 w-4 text-gold" />
              <span className="text-sm font-semibold text-gold">Nível Avançado</span>
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

        {/* Conquistas Recentes */}
        <Card className="p-6 gradient-card border-0 shadow-md animate-slide-up" style={{ animationDelay: "0.4s" }}>
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
        <Card className="p-4 gradient-card border-0 shadow-md animate-slide-up" style={{ animationDelay: "0.5s" }}>
          <h3 className="font-semibold text-foreground mb-3 px-2">Configurações</h3>
          <div className="space-y-2">
            <button className="w-full text-left px-3 py-3 hover:bg-muted/30 rounded-xl transition-smooth text-sm text-foreground">
              Editar Perfil
            </button>
            <button className="w-full text-left px-3 py-3 hover:bg-muted/30 rounded-xl transition-smooth text-sm text-foreground">
              Notificações
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
          style={{ animationDelay: "0.6s" }}
        >
          <LogOut className="mr-2 h-5 w-5" />
          Sair da Conta
        </Button>
      </div>

      <BottomNav />
    </div>
  );
};

export default Perfil;
