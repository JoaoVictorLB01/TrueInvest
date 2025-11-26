import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Target, Calendar, TrendingUp, Award, CheckCircle2, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

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
  valor_objetivo: number;
  pontos_recompensa: number;
  periodo: string;
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
  const [loading, setLoading] = useState(true);
  const [ranking, setRanking] = useState<number | null>(null);

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

    // Fetch metas
    const { data: metasData } = await supabase
      .from('metas')
      .select('*')
      .eq('ativo', true)
      .order('periodo');

    if (metasData) {
      setMetas(metasData);
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
                  {profile?.pontos_totais.toLocaleString() || 0}
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
              // For now, show 0 progress since we need to implement progress tracking
              const progresso = 0;
              
              return (
                <Card 
                  key={meta.id}
                  className="p-5 gradient-card border-0 shadow-md card-interactive opacity-0-animate animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`h-6 w-6 ${colors.color}`} />
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-foreground">{meta.titulo}</h4>
                          <p className="text-xs text-muted-foreground capitalize">{meta.periodo}</p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          +{meta.pontos_recompensa} pts
                        </Badge>
                      </div>

                      <div className="mb-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">0 de {meta.valor_objetivo}</span>
                          <span className="font-medium text-foreground">{progresso}%</span>
                        </div>
                        <Progress value={progresso} className="h-2" />
                      </div>

                      <p className="text-xs text-muted-foreground">
                        {meta.valor_objetivo} faltando para completar
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
