import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Trophy, Medal, TrendingUp, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  nome: string;
  pontos_totais: number;
  foto: string | null;
}

const getMedalColor = (posicao: number) => {
  if (posicao === 1) return "text-gold";
  if (posicao === 2) return "text-muted-foreground";
  if (posicao === 3) return "text-amber-600";
  return "text-muted-foreground";
};

const getMedalBg = (posicao: number) => {
  if (posicao === 1) return "bg-gold/20";
  if (posicao === 2) return "bg-muted/20";
  if (posicao === 3) return "bg-amber-600/20";
  return "bg-muted/10";
};

const Ranking = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [periodo, setPeriodo] = useState<"semanal" | "mensal">("mensal");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }

    if (user) {
      fetchRanking();
    }
  }, [user, authLoading, navigate]);

  const fetchRanking = async () => {
    // Use the public view that only exposes necessary fields (no email/phone)
    const { data, error } = await supabase
      .from('profiles_public')
      .select('id, nome, pontos_totais, foto')
      .order('pontos_totais', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching ranking:', error);
    } else {
      setProfiles(data || []);
    }
    setLoading(false);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const renderCorretor = (profile: Profile, index: number) => {
    const posicao = index + 1;
    const isCurrentUser = user?.id === profile.id;
    
    return (
      <Card 
        key={profile.id} 
        className={`p-4 gradient-card border-0 shadow-md card-interactive opacity-0-animate animate-fade-in ${
          posicao <= 3 ? "ring-2 ring-gold/20" : ""
        } ${isCurrentUser ? "ring-2 ring-primary" : ""}`}
        style={{ animationDelay: `${index * 0.1}s` }}
      >
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 ${getMedalBg(posicao)} rounded-xl flex items-center justify-center flex-shrink-0`}>
            {posicao <= 3 ? (
              <Medal className={`h-6 w-6 ${getMedalColor(posicao)}`} />
            ) : (
              <span className="font-bold text-foreground">{posicao}º</span>
            )}
          </div>

          <Avatar className="h-12 w-12 border-2 border-gold/20">
            <AvatarImage src={profile.foto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.nome}`} />
            <AvatarFallback>{getInitials(profile.nome)}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">
              {profile.nome}
              {isCurrentUser && <span className="text-primary text-sm ml-2">(você)</span>}
            </h3>
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-gold" />
              <span className="text-muted-foreground">{profile.pontos_totais.toLocaleString()} pontos</span>
            </div>
          </div>

          {posicao === 1 && (
            <Trophy className="h-6 w-6 text-gold flex-shrink-0 animate-float" />
          )}
        </div>
      </Card>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  const top3 = profiles.slice(0, 3);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header 
        title="Ranking"
        subtitle="Veja sua posição e os líderes"
        showLogout
      />

      <div className="p-6 space-y-6 -mt-6">
        {/* Pódio */}
        {top3.length >= 3 && (
          <Card className="p-6 gradient-gold border-0 shadow-gold opacity-0-animate animate-scale-in">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Trophy className="h-8 w-8 text-gold-foreground" />
              <h2 className="text-2xl font-bold text-gold-foreground">Top 3</h2>
            </div>

            <div className="flex justify-center items-end gap-2">
              {/* 2º Lugar */}
              <div className="flex-1 text-center pb-4 opacity-0-animate animate-slide-up delay-100">
                <Avatar className="h-16 w-16 mx-auto mb-2 border-4 border-white/50">
                  <AvatarImage src={top3[1]?.foto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${top3[1]?.nome}`} />
                  <AvatarFallback>2º</AvatarFallback>
                </Avatar>
                <p className="text-sm font-medium text-gold-foreground mb-1">{top3[1]?.nome.split(' ')[0]}</p>
                <div className="bg-white/20 rounded-t-xl h-20 flex items-center justify-center">
                  <div className="text-center">
                    <Medal className="h-6 w-6 text-white/90 mx-auto mb-1" />
                    <p className="text-xs text-white/90 font-semibold">2º</p>
                  </div>
                </div>
              </div>

              {/* 1º Lugar */}
              <div className="flex-1 text-center opacity-0-animate animate-slide-up">
                <Avatar className="h-20 w-20 mx-auto mb-2 border-4 border-white ring-4 ring-gold">
                  <AvatarImage src={top3[0]?.foto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${top3[0]?.nome}`} />
                  <AvatarFallback>1º</AvatarFallback>
                </Avatar>
                <p className="text-sm font-bold text-gold-foreground mb-1">{top3[0]?.nome.split(' ')[0]}</p>
                <div className="bg-white/30 rounded-t-xl h-28 flex items-center justify-center">
                  <div className="text-center">
                    <Trophy className="h-8 w-8 text-white mx-auto mb-1 animate-float" />
                    <p className="text-sm text-white font-bold">1º</p>
                  </div>
                </div>
              </div>

              {/* 3º Lugar */}
              <div className="flex-1 text-center pb-8 opacity-0-animate animate-slide-up delay-200">
                <Avatar className="h-14 w-14 mx-auto mb-2 border-4 border-white/50">
                  <AvatarImage src={top3[2]?.foto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${top3[2]?.nome}`} />
                  <AvatarFallback>3º</AvatarFallback>
                </Avatar>
                <p className="text-sm font-medium text-gold-foreground mb-1">{top3[2]?.nome.split(' ')[0]}</p>
                <div className="bg-white/20 rounded-t-xl h-16 flex items-center justify-center">
                  <div className="text-center">
                    <Medal className="h-5 w-5 text-white/90 mx-auto mb-1" />
                    <p className="text-xs text-white/90 font-semibold">3º</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {profiles.length === 0 && (
          <Card className="p-8 gradient-card border-0 shadow-md text-center">
            <Trophy className="h-16 w-16 text-gold/30 mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2">Nenhum corretor ainda</h3>
            <p className="text-sm text-muted-foreground">Seja o primeiro a pontuar!</p>
          </Card>
        )}

        {/* Abas de Período */}
        {profiles.length > 0 && (
          <Tabs value={periodo} onValueChange={(v) => setPeriodo(v as "semanal" | "mensal")} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="semanal">Semanal</TabsTrigger>
              <TabsTrigger value="mensal">Mensal</TabsTrigger>
            </TabsList>

            <TabsContent value="semanal" className="space-y-3 mt-0">
              {profiles.map((profile, index) => renderCorretor(profile, index))}
            </TabsContent>

            <TabsContent value="mensal" className="space-y-3 mt-0">
              {profiles.map((profile, index) => renderCorretor(profile, index))}
            </TabsContent>
          </Tabs>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Ranking;
