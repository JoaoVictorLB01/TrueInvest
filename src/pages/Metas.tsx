import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, Calendar, TrendingUp, Award, CheckCircle2, Loader2, Undo2, RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Profile {
  id: string;
  nome: string;
  pontos_totais: number;
}

interface Meta {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: string;
  tipo_meta: 'unica' | 'recorrente';
  valor_objetivo: number;
  pontos_recompensa: number;
  periodo: string;
}

interface MetaEvento {
  id: string;
  user_id: string;
  meta_id: string;
  data_hora: string;
  pontos_ganhos: number;
}

interface Conquista {
  id: string;
  titulo: string;
  descricao: string | null;
  icone: string | null;
  pontos_recompensa: number;
}

const getIconByType = (tipo: string) => {
  switch (tipo) {
    case 'reunioes': return Calendar;
    case 'vendas': return TrendingUp;
    case 'visitas': return Target;
    case 'pontualidade': return CheckCircle2;
    default: return Target;
  }
};

const getColorByType = (tipo: string) => {
  switch (tipo) {
    case 'reunioes': return { color: 'text-gold', bg: 'bg-gold/10' };
    case 'vendas': return { color: 'text-success', bg: 'bg-success/10' };
    case 'visitas': return { color: 'text-primary', bg: 'bg-primary/10' };
    case 'pontualidade': return { color: 'text-gold', bg: 'bg-gold/10' };
    default: return { color: 'text-primary', bg: 'bg-primary/10' };
  }
};

const Metas = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [metas, setMetas] = useState<Meta[]>([]);
  const [conquistas, setConquistas] = useState<Conquista[]>([]);
  const [userConquistas, setUserConquistas] = useState<string[]>([]);
  const [metaEventos, setMetaEventos] = useState<Record<string, MetaEvento[]>>({});
  const [loading, setLoading] = useState(true);
  const [ranking, setRanking] = useState<number | null>(null);
  const [processingMeta, setProcessingMeta] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }

    if (user) {
      fetchData();
    }
  }, [user, authLoading, navigate]);

  const fetchData = async () => {
    if (!user) return;

    // Fetch profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileData) {
      setProfile(profileData);
    }

    // Fetch metas with tipo_meta
    const { data: metasData } = await supabase
      .from('metas')
      .select('*')
      .eq('ativo', true)
      .order('periodo');

    if (metasData) {
      // Cast to include tipo_meta
      setMetas(metasData as Meta[]);
    }

    // Fetch conquistas
    const { data: conquistasData } = await supabase
      .from('conquistas')
      .select('*');

    if (conquistasData) {
      setConquistas(conquistasData);
    }

    // Fetch user conquistas
    const { data: userConquistasData } = await supabase
      .from('user_conquistas')
      .select('conquista_id')
      .eq('user_id', user.id);

    if (userConquistasData) {
      setUserConquistas(userConquistasData.map(uc => uc.conquista_id));
    }

    // Fetch meta_eventos for the user
    const { data: eventosData } = await supabase
      .from('meta_eventos')
      .select('*')
      .eq('user_id', user.id)
      .order('data_hora', { ascending: false });

    if (eventosData) {
      // Group events by meta_id
      const eventosMap: Record<string, MetaEvento[]> = {};
      eventosData.forEach((evento: MetaEvento) => {
        if (!eventosMap[evento.meta_id]) {
          eventosMap[evento.meta_id] = [];
        }
        eventosMap[evento.meta_id].push(evento);
      });
      setMetaEventos(eventosMap);
    }

    // Calculate ranking using public view (no sensitive data exposed)
    const { data: allProfiles } = await supabase
      .from('profiles_public')
      .select('id, pontos_totais')
      .order('pontos_totais', { ascending: false });

    if (allProfiles) {
      const userRanking = allProfiles.findIndex(p => p.id === user.id) + 1;
      setRanking(userRanking > 0 ? userRanking : null);
    }

    setLoading(false);
  };

  const handleConcluirMeta = async (meta: Meta) => {
    if (!user || !profile) return;
    
    setProcessingMeta(meta.id);
    
    try {
      // Add points to user
      const newPoints = (profile.pontos_totais || 0) + meta.pontos_recompensa;
      
      await supabase
        .from('profiles')
        .update({ pontos_totais: newPoints })
        .eq('id', user.id);

      // Create event record
      await supabase
        .from('meta_eventos')
        .insert({
          user_id: user.id,
          meta_id: meta.id,
          pontos_ganhos: meta.pontos_recompensa
        });

      toast.success(`Meta concluída! +${meta.pontos_recompensa} pontos`);
      
      // Reload data to sync UI
      await fetchData();
    } catch (error) {
      toast.error("Erro ao concluir meta");
      console.error(error);
    } finally {
      setProcessingMeta(null);
    }
  };

  const handleDesfazerMeta = async (meta: Meta) => {
    if (!user || !profile) return;
    
    const eventos = metaEventos[meta.id] || [];
    if (eventos.length === 0) return;
    
    setProcessingMeta(meta.id);
    
    try {
      // Get the most recent event for this meta
      const ultimoEvento = eventos[0]; // Already sorted by data_hora DESC
      
      // Calculate new points (don't go negative)
      const newPoints = Math.max(0, (profile.pontos_totais || 0) - ultimoEvento.pontos_ganhos);
      
      // Update user points
      await supabase
        .from('profiles')
        .update({ pontos_totais: newPoints })
        .eq('id', user.id);

      // Delete the most recent event
      await supabase
        .from('meta_eventos')
        .delete()
        .eq('id', ultimoEvento.id);

      toast.success(`Meta desfeita! -${ultimoEvento.pontos_ganhos} pontos`);
      
      // Reload data to sync UI
      await fetchData();
    } catch (error) {
      toast.error("Erro ao desfazer meta");
      console.error(error);
    } finally {
      setProcessingMeta(null);
    }
  };

  const getMetaStatus = (meta: Meta) => {
    const eventos = metaEventos[meta.id] || [];
    const count = eventos.length;
    
    if (meta.tipo_meta === 'unica') {
      return {
        isCompleted: count > 0,
        count,
        canComplete: count === 0,
        canUndo: count > 0
      };
    } else {
      // Recorrente
      return {
        isCompleted: false, // Recorrentes nunca são "completadas" definitivamente
        count,
        canComplete: true, // Sempre pode adicionar mais
        canUndo: count > 0
      };
    }
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
        title="Metas"
        subtitle="Acompanhe seu progresso"
        showLogout
      />

      <div className="p-6 space-y-6 -mt-6">
        {/* Resumo de Pontos */}
        <Card className="p-6 gradient-gold border-0 shadow-gold opacity-0-animate animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Award className="h-10 w-10 text-gold-foreground" />
              <div>
                <p className="text-sm text-gold-foreground/80">Pontuação Total</p>
                <h2 className="text-3xl font-bold text-gold-foreground">
                  {profile?.pontos_totais?.toLocaleString() || 0}
                </h2>
              </div>
            </div>
            {ranking && (
              <Badge className="bg-white/20 text-gold-foreground border-0">
                {ranking}º Lugar
              </Badge>
            )}
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gold-foreground/90 mb-2">
              <span>Nível Atual: {(profile?.pontos_totais || 0) < 1000 ? 'Iniciante' : (profile?.pontos_totais || 0) < 3000 ? 'Avançado' : 'Expert'}</span>
              <span>{Math.max(0, 4000 - (profile?.pontos_totais || 0)).toLocaleString()} até Expert</span>
            </div>
            <Progress value={Math.min(100, ((profile?.pontos_totais || 0) / 4000) * 100)} className="h-2 bg-white/20" />
          </div>
        </Card>

        {/* Metas Ativas */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Metas Ativas</h3>
          <div className="space-y-3">
            {metas.map((meta, index) => {
              const Icon = getIconByType(meta.tipo);
              const colors = getColorByType(meta.tipo);
              const status = getMetaStatus(meta);
              const isRecorrente = meta.tipo_meta === 'recorrente';
              const progresso = meta.tipo_meta === 'unica' 
                ? (status.isCompleted ? 100 : 0)
                : Math.min(100, (status.count / meta.valor_objetivo) * 100);
              
              return (
                <Card 
                  key={meta.id}
                  className={`p-5 border-0 shadow-md card-interactive opacity-0-animate animate-slide-up ${
                    status.isCompleted && meta.tipo_meta === 'unica' ? "gradient-gold" : "gradient-card"
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`h-6 w-6 ${colors.color}`} />
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-foreground">{meta.titulo}</h4>
                            {isRecorrente && (
                              <Badge variant="outline" className="text-xs">
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Recorrente
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground capitalize">{meta.periodo}</p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          +{meta.pontos_recompensa} pts
                        </Badge>
                      </div>

                      <div className="mb-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span className={status.isCompleted && meta.tipo_meta === 'unica' ? "text-gold-foreground/80" : "text-muted-foreground"}>
                            {isRecorrente ? `${status.count}x concluída` : (status.isCompleted ? meta.valor_objetivo : 0)} 
                            {!isRecorrente && ` de ${meta.valor_objetivo}`}
                          </span>
                          <span className={`font-medium ${status.isCompleted && meta.tipo_meta === 'unica' ? "text-gold-foreground" : "text-foreground"}`}>
                            {Math.round(progresso)}%
                          </span>
                        </div>
                        <Progress value={progresso} className="h-2" />
                      </div>

                      {status.isCompleted && meta.tipo_meta === 'unica' && (
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="h-4 w-4 text-gold-foreground" />
                          <p className="text-xs text-gold-foreground font-medium">
                            Meta concluída!
                          </p>
                        </div>
                      )}

                      {isRecorrente && status.count > 0 && (
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="h-4 w-4 text-success" />
                          <p className="text-xs text-success font-medium">
                            Total ganho: {status.count * meta.pontos_recompensa} pontos
                          </p>
                        </div>
                      )}

                      {/* Buttons */}
                      <div className="flex gap-2 mt-3">
                        {/* Concluir Meta Button - Show for recurring or if unique is not completed */}
                        {status.canComplete && (
                          <Button
                            onClick={() => handleConcluirMeta(meta)}
                            disabled={processingMeta === meta.id}
                            className="flex-1 bg-gold hover:bg-gold/90 text-gold-foreground"
                            size="sm"
                          >
                            {processingMeta === meta.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processando...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Concluir Meta
                              </>
                            )}
                          </Button>
                        )}

                        {/* Desfazer Meta Button - Show if there are events to undo */}
                        {status.canUndo && (
                          <Button
                            onClick={() => handleDesfazerMeta(meta)}
                            disabled={processingMeta === meta.id}
                            variant="outline"
                            className={`${status.canComplete ? '' : 'flex-1'} border-destructive/50 text-destructive hover:bg-destructive/10`}
                            size="sm"
                          >
                            {processingMeta === meta.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processando...
                              </>
                            ) : (
                              <>
                                <Undo2 className="mr-2 h-4 w-4" />
                                Desfazer{isRecorrente && status.count > 0 ? ` (${status.count})` : ''}
                              </>
                            )}
                          </Button>
                        )}
                      </div>
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
            {conquistas.map((conquista, index) => {
              const conquistado = userConquistas.includes(conquista.id);
              
              return (
                <Card 
                  key={conquista.id}
                  className={`p-4 border-0 shadow-md card-interactive opacity-0-animate animate-fade-in ${
                    conquistado 
                      ? "gradient-card" 
                      : "bg-muted/30"
                  }`}
                  style={{ animationDelay: `${(metas.length + index) * 0.1}s` }}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      conquistado 
                        ? "bg-gold/20" 
                        : "bg-muted"
                    }`}>
                      <Award className={`h-6 w-6 ${
                        conquistado 
                          ? "text-gold" 
                          : "text-muted-foreground"
                      }`} />
                    </div>

                    <div className="flex-1">
                      <h4 className={`font-semibold ${
                        conquistado 
                          ? "text-foreground" 
                          : "text-muted-foreground"
                      }`}>
                        {conquista.titulo}
                      </h4>
                      <p className="text-sm text-muted-foreground">{conquista.descricao}</p>
                      {conquista.pontos_recompensa > 0 && (
                        <p className="text-xs text-gold mt-1">+{conquista.pontos_recompensa} pontos</p>
                      )}
                    </div>

                    {conquistado && (
                      <CheckCircle2 className="h-6 w-6 text-success flex-shrink-0" />
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Metas;
