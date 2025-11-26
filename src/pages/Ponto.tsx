import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Calendar, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface PontoRegistro {
  id: string;
  entrada: string;
  saida: string | null;
  localizacao_entrada: string | null;
  localizacao_saida: string | null;
}

const Ponto = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [pontoStatus, setPontoStatus] = useState<"entrada" | "saida" | null>(null);
  const [pontoAtual, setPontoAtual] = useState<PontoRegistro | null>(null);
  const [horarioAtual, setHorarioAtual] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [marcando, setMarcando] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }

    // Atualizar horário a cada segundo
    const interval = setInterval(() => {
      setHorarioAtual(new Date());
    }, 1000);

    if (user) {
      checkPontoHoje();
    }

    return () => clearInterval(interval);
  }, [user, authLoading, navigate]);

  const checkPontoHoje = async () => {
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
      setPontoAtual(data);
      setPontoStatus(data.saida ? null : "saida");
    } else {
      setPontoStatus("entrada");
    }
    setLoading(false);
  };

  const marcarPonto = async () => {
    if (!user || marcando) return;
    
    setMarcando(true);
    const agora = new Date();

    try {
      if (pontoStatus === "entrada") {
        const { data, error } = await supabase
          .from('registros_ponto')
          .insert({
            user_id: user.id,
            entrada: agora.toISOString(),
            localizacao_entrada: "Localização capturada"
          })
          .select()
          .single();

        if (error) throw error;

        setPontoAtual(data);
        setPontoStatus("saida");
        toast.success("Entrada registrada com sucesso!");
      } else if (pontoStatus === "saida" && pontoAtual) {
        const { data, error } = await supabase
          .from('registros_ponto')
          .update({
            saida: agora.toISOString(),
            localizacao_saida: "Localização capturada"
          })
          .eq('id', pontoAtual.id)
          .select()
          .single();

        if (error) throw error;

        setPontoAtual(data);
        setPontoStatus(null);
        toast.success("Saída registrada com sucesso!");
      }
    } catch (error) {
      console.error('Error marking ponto:', error);
      toast.error("Erro ao registrar ponto. Tente novamente.");
    } finally {
      setMarcando(false);
    }
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header 
        title="Registro de Ponto"
        subtitle="Marque sua entrada e saída"
      />

      <div className="p-6 space-y-6 -mt-6">
        {/* Relógio */}
        <Card className="p-8 gradient-card border-0 shadow-lg opacity-0-animate animate-fade-in text-center">
          <Clock className="h-16 w-16 text-gold mx-auto mb-4 animate-pulse-soft" />
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
          <Card className="p-6 gradient-card border-0 shadow-md opacity-0-animate animate-slide-up">
            <h3 className="font-semibold text-foreground mb-4">Registro de Hoje</h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-success/10 rounded-xl">
                <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Entrada</p>
                  <p className="text-xs text-muted-foreground">{formatTime(pontoAtual.entrada)}</p>
                </div>
              </div>

              {pontoAtual.saida && (
                <div className="flex items-center gap-3 p-3 bg-success/10 rounded-xl opacity-0-animate animate-scale-in">
                  <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Saída</p>
                    <p className="text-xs text-muted-foreground">{formatTime(pontoAtual.saida)}</p>
                  </div>
                </div>
              )}

              {pontoAtual.localizacao_entrada && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3">
                  <MapPin className="h-4 w-4" />
                  <span>{pontoAtual.localizacao_entrada}</span>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Botão de Marcar Ponto */}
        {pontoStatus && (
          <div className="opacity-0-animate animate-scale-in delay-200">
            <Button
              onClick={marcarPonto}
              disabled={marcando}
              className="w-full h-20 text-xl font-bold bg-gold hover:bg-gold/90 text-gold-foreground rounded-2xl shadow-gold hover-lift press-effect animate-glow"
            >
              {marcando ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                `Marcar ${pontoStatus === "entrada" ? "Entrada" : "Saída"}`
              )}
            </Button>
            
            <p className="text-center text-sm text-muted-foreground mt-4">
              {pontoStatus === "entrada" 
                ? "Clique para registrar sua entrada" 
                : "Clique para registrar sua saída"}
            </p>
          </div>
        )}

        {!pontoStatus && pontoAtual && (
          <Card className="p-6 gradient-card border-0 shadow-md text-center opacity-0-animate animate-bounce-in delay-200">
            <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-3" />
            <p className="font-semibold text-foreground">Ponto completo!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Você já registrou entrada e saída hoje
            </p>
          </Card>
        )}

        {/* Informações */}
        <Card className="p-6 gradient-card border-0 shadow-md opacity-0-animate animate-slide-up delay-300">
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
