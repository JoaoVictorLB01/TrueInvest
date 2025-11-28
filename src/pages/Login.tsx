import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, UserPlus, Mail, Lock, User, ArrowLeft, Loader2, Shield } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

const signupSchema = z.object({
  nome: z.string().trim().min(3, "Nome deve ter no mínimo 3 caracteres").max(100, "Nome muito longo"),
  email: z.string().trim().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();
  const { signIn, signUp, user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/dashboard");
    }
  }, [user, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        toast.error("E-mail ou senha incorretos");
      } else if (error.message.includes("Email not confirmed")) {
        toast.error("Confirme seu e-mail antes de fazer login");
      } else {
        toast.error("Erro ao fazer login. Tente novamente.");
      }
      return;
    }

    toast.success("Login realizado com sucesso!");
    navigate("/dashboard");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = signupSchema.safeParse({ nome, email, password, confirmPassword });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, nome);
    setLoading(false);

    if (error) {
      if (error.message.includes("User already registered")) {
        toast.error("Este e-mail já está cadastrado");
      } else {
        toast.error("Erro ao criar conta. Tente novamente.");
      }
      return;
    }

    toast.success("Conta criada com sucesso! Você já pode fazer login.");
    setIsSignUp(false);
    setNome("");
    setPassword("");
    setConfirmPassword("");
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setNome("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-primary">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-primary p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-block mb-6">
            <div className="w-20 h-20 bg-gold rounded-2xl flex items-center justify-center shadow-gold animate-bounce-in">
              <span className="text-3xl font-bold text-primary">TI</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 animate-slide-up">True Invest</h1>
          <p className="text-white/80 animate-slide-up delay-100">Portal dos Corretores</p>
        </div>

        <div className="bg-card rounded-3xl p-8 shadow-xl animate-scale-in">
          {isSignUp ? (
            // Formulário de Cadastro
            <form onSubmit={handleSignUp} className="space-y-5">
              <div className="flex items-center gap-2 mb-6">
                <button
                  type="button"
                  onClick={toggleMode}
                  className="p-2 hover:bg-muted rounded-xl transition-smooth"
                >
                  <ArrowLeft className="h-5 w-5 text-muted-foreground" />
                </button>
                <h2 className="text-xl font-semibold text-foreground">Criar Conta</h2>
              </div>

              <div className="space-y-2 opacity-0-animate animate-slide-up">
                <Label htmlFor="nome" className="text-foreground flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Nome Completo
                </Label>
                <Input
                  id="nome"
                  type="text"
                  placeholder="Seu nome completo"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="h-12 rounded-xl"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2 opacity-0-animate animate-slide-up delay-100">
                <Label htmlFor="email-signup" className="text-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  E-mail
                </Label>
                <Input
                  id="email-signup"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-xl"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2 opacity-0-animate animate-slide-up delay-200">
                <Label htmlFor="password-signup" className="text-foreground flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  Senha
                </Label>
                <Input
                  id="password-signup"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-xl"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2 opacity-0-animate animate-slide-up delay-300">
                <Label htmlFor="confirm-password" className="text-foreground flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  Confirmar Senha
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Repita sua senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12 rounded-xl"
                  disabled={loading}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl bg-gold hover:bg-gold/90 text-gold-foreground font-semibold transition-smooth shadow-gold hover-lift press-effect"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="mr-2 h-5 w-5" />
                    Criar Conta
                  </>
                )}
              </Button>
            </form>
          ) : (
            // Formulário de Login
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2 opacity-0-animate animate-slide-up">
                <Label htmlFor="email" className="text-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-xl"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2 opacity-0-animate animate-slide-up delay-100">
                <Label htmlFor="password" className="text-foreground flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-xl"
                  disabled={loading}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl bg-gold hover:bg-gold/90 text-gold-foreground font-semibold transition-smooth shadow-gold hover-lift press-effect opacity-0-animate animate-slide-up delay-200"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <LogIn className="mr-2 h-5 w-5" />
                    Entrar
                  </>
                )}
              </Button>

              <div className="relative my-6 opacity-0-animate animate-fade-in delay-300">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">ou</span>
                </div>
              </div>

              <Button 
                type="button"
                variant="outline"
                onClick={toggleMode}
                className="w-full h-12 rounded-xl font-semibold transition-smooth hover-lift press-effect opacity-0-animate animate-slide-up delay-400"
                disabled={loading}
              >
                <UserPlus className="mr-2 h-5 w-5" />
                Criar nova conta
              </Button>

              <Button 
                type="button"
                variant="ghost"
                onClick={() => navigate("/admin")}
                className="w-full h-10 rounded-xl text-sm transition-smooth hover:bg-gold/10 opacity-0-animate animate-fade-in delay-500"
                disabled={loading}
              >
                Acesso Admin
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-white/60 text-sm mt-6 animate-fade-in delay-500">
          Acesso exclusivo para corretores True Invest
        </p>
      </div>
    </div>
  );
};

export default Login;
