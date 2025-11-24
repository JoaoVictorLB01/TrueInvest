import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Calendar, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface PontoRegistro {
  entrada: string;
  saida?: string;
  localizacao?: string;
}

const Ponto = () => {
  const navigate = useNavigate();
  const [pontoStatus, setPontoStatus] = useState<"entrada" | "saida" | null>(null);
  const [pontoAtual, setPontoAtual] = useState<PontoRegistro | null>(null);
  const [horarioAtual, setHorarioAtual] = useState(new Date());

  useEffect(() => {
    const corretorData = localStorage.getItem("corretor");
    if (!corretorData) {
      navigate("/login");
      return;
    }

    // Atualizar horário a cada segundo
    const interval = setInterval(() => {
      setHorarioAtual(new Date());
    }, 1000);

    // Verificar status do ponto de hoje
    const pontoKey = `ponto-${new Date().toDateString()}`;
    const pontoHoje = localStorage.getItem(pontoKey);
    
    if (pontoHoje) {
      const ponto = JSON.parse(pontoHoje);
      setPontoAtual(ponto);
      setPontoStatus(ponto.saida ? null : "saida");
    } else {
      setPontoStatus("entrada");
    }

    return () => clearInterval(interval);
  }, [navigate]);

  const marcarPonto = () => {
    const agora = new Date().toLocaleTimeString("pt-BR");
    const pontoKey = `ponto-${new Date().toDateString()}`;

    if (pontoStatus === "entrada") {
      const novoPonto: PontoRegistro = {
        entrada: agora,
        localizacao: "Localização capturada"
      };
      localStorage.setItem(pontoKey, JSON.stringify(novoPonto));
      setPontoAtual(novoPonto);
      setPontoStatus("saida");
      toast.success("Entrada registrada com sucesso!");
    } else if (pontoStatus === "saida") {
      const pontoExistente = JSON.parse(localStorage.getItem(pontoKey) || "{}");
      pontoExistente.saida = agora;
      localStorage.setItem(pontoKey, JSON.stringify(pontoExistente));
      setPontoAtual(pontoExistente);
      setPontoStatus(null);
      toast.success("Saída registrada com sucesso!");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header 
        title="Registro de Ponto"
        subtitle="Marque sua entrada e saída"
      />

      <div className="p-6 space-y-6 -mt-6">
        {/* Relógio */}
        <Card className="p-8 gradient-card border-0 shadow-lg animate-fade-in text-center">
          <Clock className="h-16 w-16 text-gold mx-auto mb-4" />
          <div className="text-5xl font-bold text-foreground mb-2">
            {horarioAtual.toLocaleTimeString("pt-BR", { 
              hour: "2-digit", 
              minute: "2-digit"
            })}
          </div>
          <div className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Calendar className="h-4 w-4" />
            {horarioAtual.toLocaleDateString("pt-BR", { 
              weekday: "long",
              day: "numeric",
              month: "long"
            })}
          </div>
        </Card>

        {/* Status Atual */}
        {pontoAtual && (
          <Card className="p-6 gradient-card border-0 shadow-md animate-slide-up">
            <h3 className="font-semibold text-foreground mb-4">Registro de Hoje</h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-success/10 rounded-xl">
                <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Entrada</p>
                  <p className="text-xs text-muted-foreground">{pontoAtual.entrada}</p>
                </div>
              </div>

              {pontoAtual.saida && (
                <div className="flex items-center gap-3 p-3 bg-success/10 rounded-xl">
                  <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Saída</p>
                    <p className="text-xs text-muted-foreground">{pontoAtual.saida}</p>
                  </div>
                </div>
              )}

              {pontoAtual.localizacao && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3">
                  <MapPin className="h-4 w-4" />
                  <span>{pontoAtual.localizacao}</span>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Botão de Marcar Ponto */}
        {pontoStatus && (
          <div className="animate-scale-in">
            <Button
              onClick={marcarPonto}
              className="w-full h-20 text-xl font-bold bg-gold hover:bg-gold/90 text-gold-foreground rounded-2xl shadow-gold transition-smooth"
            >
              Marcar {pontoStatus === "entrada" ? "Entrada" : "Saída"}
            </Button>
            
            <p className="text-center text-sm text-muted-foreground mt-4">
              {pontoStatus === "entrada" 
                ? "Clique para registrar sua entrada" 
                : "Clique para registrar sua saída"}
            </p>
          </div>
        )}

        {!pontoStatus && (
          <Card className="p-6 gradient-card border-0 shadow-md text-center">
            <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-3" />
            <p className="font-semibold text-foreground">Ponto completo!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Você já registrou entrada e saída hoje
            </p>
          </Card>
        )}

        {/* Informações */}
        <Card className="p-6 gradient-card border-0 shadow-md">
          <h3 className="font-semibold text-foreground mb-3">Informações</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="text-gold">•</span>
              Registre sua entrada ao chegar
            </li>
            <li className="flex gap-2">
              <span className="text-gold">•</span>
              Registre sua saída ao final do expediente
            </li>
            <li className="flex gap-2">
              <span className="text-gold">•</span>
              A localização é capturada para segurança
            </li>
            <li className="flex gap-2">
              <span className="text-gold">•</span>
              Pontualidade gera pontos extras!
            </li>
          </ul>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default Ponto;
