import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn } from "lucide-react";
import { toast } from "sonner";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mock login - em produção, integrar com API real
    if (email && password) {
      localStorage.setItem("corretor", JSON.stringify({
        id: "1",
        nome: "Carlos Silva",
        email: email,
        foto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos"
      }));
      toast.success("Login realizado com sucesso!");
      navigate("/dashboard");
    } else {
      toast.error("Preencha todos os campos");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-primary p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-block mb-6">
            <div className="w-20 h-20 bg-gold rounded-2xl flex items-center justify-center shadow-gold">
              <span className="text-3xl font-bold text-primary">TI</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">True Invest</h1>
          <p className="text-white/80">Portal dos Corretores</p>
        </div>

        <div className="bg-card rounded-3xl p-8 shadow-xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl bg-gold hover:bg-gold/90 text-gold-foreground font-semibold transition-smooth shadow-gold"
            >
              <LogIn className="mr-2 h-5 w-5" />
              Entrar
            </Button>

            <button
              type="button"
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-smooth"
            >
              Esqueci minha senha
            </button>
          </form>
        </div>

        <p className="text-center text-white/60 text-sm mt-6">
          Acesso exclusivo para corretores True Invest
        </p>
      </div>
    </div>
  );
};

export default Login;
