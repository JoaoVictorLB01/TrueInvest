import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Target, Calendar, TrendingUp, Award, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const Metas = () => {
  const metas = [
    {
      titulo: "Reuniões do Mês",
      atual: 12,
      total: 20,
      pontos: 50,
      icon: Calendar,
      color: "text-gold",
      bgColor: "bg-gold/10",
    },
    {
      titulo: "Vendas do Mês",
      atual: 5,
      total: 8,
      pontos: 100,
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      titulo: "Visitas Agendadas",
      atual: 8,
      total: 15,
      pontos: 30,
      icon: Target,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      titulo: "Pontualidade",
      atual: 18,
      total: 22,
      pontos: 20,
      icon: CheckCircle2,
      color: "text-gold",
      bgColor: "bg-gold/10",
    },
  ];

  const conquistas = [
    { titulo: "Vendedor Estrela", descricao: "5 vendas em um mês", conquistado: true },
    { titulo: "Pontual", descricao: "15 dias consecutivos no horário", conquistado: true },
    { titulo: "Super Produtivo", descricao: "20 reuniões em um mês", conquistado: false },
    { titulo: "Líder do Mês", descricao: "1º lugar no ranking mensal", conquistado: false },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header 
        title="Metas"
        subtitle="Acompanhe seu progresso"
      />

      <div className="p-6 space-y-6 -mt-6">
        {/* Resumo de Pontos */}
        <Card className="p-6 gradient-gold border-0 shadow-gold animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Award className="h-10 w-10 text-gold-foreground" />
              <div>
                <p className="text-sm text-gold-foreground/80">Pontuação Total</p>
                <h2 className="text-3xl font-bold text-gold-foreground">2.450</h2>
              </div>
            </div>
            <Badge className="bg-white/20 text-gold-foreground border-0">
              3º Lugar
            </Badge>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gold-foreground/90 mb-2">
              <span>Nível Atual: Avançado</span>
              <span>1.550 até Expert</span>
            </div>
            <Progress value={61} className="h-2 bg-white/20" />
          </div>
        </Card>

        {/* Metas Ativas */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Metas Ativas</h3>
          <div className="space-y-3">
            {metas.map((meta, index) => {
              const progresso = (meta.atual / meta.total) * 100;
              return (
                <Card 
                  key={index}
                  className="p-5 gradient-card border-0 shadow-md hover:shadow-lg transition-smooth animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 ${meta.bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <meta.icon className={`h-6 w-6 ${meta.color}`} />
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-foreground">{meta.titulo}</h4>
                        <Badge variant="secondary" className="text-xs">
                          +{meta.pontos} pts
                        </Badge>
                      </div>

                      <div className="mb-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">{meta.atual} de {meta.total}</span>
                          <span className="font-medium text-foreground">{progresso.toFixed(0)}%</span>
                        </div>
                        <Progress value={progresso} className="h-2" />
                      </div>

                      <p className="text-xs text-muted-foreground">
                        {meta.total - meta.atual} faltando para completar
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Conquistas */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Conquistas</h3>
          <div className="space-y-3">
            {conquistas.map((conquista, index) => (
              <Card 
                key={index}
                className={`p-4 border-0 shadow-md transition-smooth animate-fade-in ${
                  conquista.conquistado 
                    ? "gradient-card" 
                    : "bg-muted/30"
                }`}
                style={{ animationDelay: `${(metas.length + index) * 0.1}s` }}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    conquista.conquistado 
                      ? "bg-gold/20" 
                      : "bg-muted"
                  }`}>
                    <Award className={`h-6 w-6 ${
                      conquista.conquistado 
                        ? "text-gold" 
                        : "text-muted-foreground"
                    }`} />
                  </div>

                  <div className="flex-1">
                    <h4 className={`font-semibold ${
                      conquista.conquistado 
                        ? "text-foreground" 
                        : "text-muted-foreground"
                    }`}>
                      {conquista.titulo}
                    </h4>
                    <p className="text-sm text-muted-foreground">{conquista.descricao}</p>
                  </div>

                  {conquista.conquistado && (
                    <CheckCircle2 className="h-6 w-6 text-success flex-shrink-0" />
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Metas;
