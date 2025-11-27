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
  created_at?: string;
}

const Ponto = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [pontoStatus, setPontoStatus] = useState<"entrada" | "saida" | null>(null);
  const [pontoAtual, setPontoAtual] = useState<PontoRegistro | null>(null);
  const [historicoMes, setHistoricoMes] = useState<PontoRegistro[]>([]);
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
      fetchHistoricoMes();
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

  const fetchHistoricoMes = async () => {
    if (!user) return;

    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

    const { data, error } = await supabase
      .from('registros_ponto')
      .select('*')
      .eq('user_id', user.id)
      .gte('entrada', firstDayOfMonth.toISOString())
      .lte('entrada', lastDayOfMonth.toISOString())
      .order('entrada', { ascending: false });

    if (error) {
      console.error('Error fetching historico:', error);
    } else if (data) {
      setHistoricoMes(data);
    }
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
        await fetchHistoricoMes();
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
        await fetchHistoricoMes();
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

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      weekday: "short"
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
        showLogout
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

        {/* Histórico do Mês */}
        {historicoMes.length > 0 && (
          <Card className="p-6 gradient-card border-0 shadow-md opacity-0-animate animate-slide-up delay-300">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gold" />
              Histórico do Mês
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {historicoMes.map((registro, index) => (
                <div 
                  key={registro.id}
                  className="p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-smooth opacity-0-animate animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-foreground">
                      {formatDate(registro.entrada)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(registro.entrada).toLocaleDateString("pt-BR", { 
                        day: "2-digit", 
                        month: "2-digit" 
                      })}
                    </span>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-success"></div>
                      <div>
                        <p className="text-xs text-muted-foreground">Entrada</p>
                        <p className="text-sm font-semibold text-foreground">{formatTime(registro.entrada)}</p>
                      </div>
                    </div>
                    
                    {registro.saida ? (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-destructive"></div>
                        <div>
                          <p className="text-xs text-muted-foreground">Saída</p>
                          <p className="text-sm font-semibold text-foreground">{formatTime(registro.saida)}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 opacity-50">
                        <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
                        <div>
                          <p className="text-xs text-muted-foreground">Saída</p>
                          <p className="text-sm text-muted-foreground">Não registrada</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Informações */}
        <Card className="p-6 gradient-card border-0 shadow-md opacity-0-animate animate-slide-up delay-400">
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
