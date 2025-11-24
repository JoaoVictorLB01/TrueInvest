import { useState } from "react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Trophy, Medal, TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Corretor {
  id: string;
  nome: string;
  pontos: number;
  foto: string;
  posicao: number;
}

const corretores: Corretor[] = [
  { id: "1", nome: "Maria Santos", pontos: 3250, foto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria", posicao: 1 },
  { id: "2", nome: "João Silva", pontos: 2890, foto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Joao", posicao: 2 },
  { id: "3", nome: "Carlos Silva", pontos: 2450, foto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos", posicao: 3 },
  { id: "4", nome: "Ana Costa", pontos: 2100, foto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ana", posicao: 4 },
  { id: "5", nome: "Pedro Lima", pontos: 1950, foto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Pedro", posicao: 5 },
  { id: "6", nome: "Julia Mendes", pontos: 1800, foto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Julia", posicao: 6 },
];

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
  const [periodo, setPeriodo] = useState<"semanal" | "mensal">("mensal");

  const renderCorretor = (corretor: Corretor, index: number) => (
    <Card 
      key={corretor.id} 
      className={`p-4 gradient-card border-0 shadow-md hover:shadow-lg transition-smooth animate-fade-in ${
        corretor.posicao <= 3 ? "ring-2 ring-gold/20" : ""
      }`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 ${getMedalBg(corretor.posicao)} rounded-xl flex items-center justify-center flex-shrink-0`}>
          {corretor.posicao <= 3 ? (
            <Medal className={`h-6 w-6 ${getMedalColor(corretor.posicao)}`} />
          ) : (
            <span className="font-bold text-foreground">{corretor.posicao}º</span>
          )}
        </div>

        <Avatar className="h-12 w-12 border-2 border-gold/20">
          <AvatarImage src={corretor.foto} />
          <AvatarFallback>{corretor.nome[0]}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{corretor.nome}</h3>
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-gold" />
            <span className="text-muted-foreground">{corretor.pontos.toLocaleString()} pontos</span>
          </div>
        </div>

        {corretor.posicao === 1 && (
          <Trophy className="h-6 w-6 text-gold flex-shrink-0" />
        )}
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header 
        title="Ranking"
        subtitle="Veja sua posição e os líderes"
      />

      <div className="p-6 space-y-6 -mt-6">
        {/* Pódio */}
        <Card className="p-6 gradient-gold border-0 shadow-gold animate-scale-in">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Trophy className="h-8 w-8 text-gold-foreground" />
            <h2 className="text-2xl font-bold text-gold-foreground">Top 3</h2>
          </div>

          <div className="flex justify-center items-end gap-2">
            {/* 2º Lugar */}
            <div className="flex-1 text-center pb-4 animate-slide-up" style={{ animationDelay: "0.1s" }}>
              <Avatar className="h-16 w-16 mx-auto mb-2 border-4 border-white/50">
                <AvatarImage src={corretores[1].foto} />
                <AvatarFallback>2º</AvatarFallback>
              </Avatar>
              <p className="text-sm font-medium text-gold-foreground mb-1">{corretores[1].nome.split(' ')[0]}</p>
              <div className="bg-white/20 rounded-t-xl h-20 flex items-center justify-center">
                <div className="text-center">
                  <Medal className="h-6 w-6 text-white/90 mx-auto mb-1" />
                  <p className="text-xs text-white/90 font-semibold">2º</p>
                </div>
              </div>
            </div>

            {/* 1º Lugar */}
            <div className="flex-1 text-center animate-slide-up">
              <Avatar className="h-20 w-20 mx-auto mb-2 border-4 border-white ring-4 ring-gold">
                <AvatarImage src={corretores[0].foto} />
                <AvatarFallback>1º</AvatarFallback>
              </Avatar>
              <p className="text-sm font-bold text-gold-foreground mb-1">{corretores[0].nome.split(' ')[0]}</p>
              <div className="bg-white/30 rounded-t-xl h-28 flex items-center justify-center">
                <div className="text-center">
                  <Trophy className="h-8 w-8 text-white mx-auto mb-1" />
                  <p className="text-sm text-white font-bold">1º</p>
                </div>
              </div>
            </div>

            {/* 3º Lugar */}
            <div className="flex-1 text-center pb-8 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <Avatar className="h-14 w-14 mx-auto mb-2 border-4 border-white/50">
                <AvatarImage src={corretores[2].foto} />
                <AvatarFallback>3º</AvatarFallback>
              </Avatar>
              <p className="text-sm font-medium text-gold-foreground mb-1">{corretores[2].nome.split(' ')[0]}</p>
              <div className="bg-white/20 rounded-t-xl h-16 flex items-center justify-center">
                <div className="text-center">
                  <Medal className="h-5 w-5 text-white/90 mx-auto mb-1" />
                  <p className="text-xs text-white/90 font-semibold">3º</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Abas de Período */}
        <Tabs value={periodo} onValueChange={(v) => setPeriodo(v as "semanal" | "mensal")} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="semanal">Semanal</TabsTrigger>
            <TabsTrigger value="mensal">Mensal</TabsTrigger>
          </TabsList>

          <TabsContent value="semanal" className="space-y-3 mt-0">
            {corretores.map((corretor, index) => renderCorretor(corretor, index))}
          </TabsContent>

          <TabsContent value="mensal" className="space-y-3 mt-0">
            {corretores.map((corretor, index) => renderCorretor(corretor, index))}
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav />
    </div>
  );
};

export default Ranking;
