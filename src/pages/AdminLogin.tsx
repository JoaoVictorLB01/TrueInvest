import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Mail, Lock, ArrowLeft, Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

const AdminLogin = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { signIn, user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      checkAdminAndRedirect();
    }
  }, [user, authLoading]);

  const checkAdminAndRedirect = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });

    if (error || !data) {
      toast.error("Acesso negado. Você não é um administrador.");
      navigate("/login");
      return;
    }

    navigate("/admin");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    
    if (error) {
      setLoading(false);
      if (error.message.includes("Invalid login credentials")) {
        toast.error("E-mail ou senha incorretos");
      } else {
        toast.error("Erro ao fazer login. Tente novamente.");
      }
      return;
    }

    // Verificar se é admin
    const { data: session } = await supabase.auth.getSession();
    if (session?.session?.user) {
      const { data: isAdmin } = await supabase
        .rpc('has_role', { _user_id: session.session.user.id, _role: 'admin' });

      setLoading(false);

      if (!isAdmin) {
        await supabase.auth.signOut();
        toast.error("Acesso negado. Você não é um administrador.");
        return;
      }

      toast.success("Login de administrador realizado!");
      navigate("/admin");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-block mb-6">
            <div className="w-20 h-20 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/50 animate-bounce-in">
              <Shield className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 animate-slide-up">Acesso Administrativo</h1>
          <p className="text-purple-200 animate-slide-up delay-100">Painel de Gestão True Invest</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-purple-500/20 animate-scale-in">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email-admin" className="text-purple-100 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                E-mail
              </Label>
              <Input
                id="email-admin"
                type="email"
                placeholder="admin@trueinvest.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl bg-slate-700/50 border-purple-500/30 text-white placeholder:text-slate-400"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password-admin" className="text-purple-100 flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Senha
              </Label>
              <Input
                id="password-admin"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl bg-slate-700/50 border-purple-500/30 text-white placeholder:text-slate-400"
                disabled={loading}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-all shadow-lg shadow-purple-500/50"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <LogIn className="mr-2 h-5 w-5" />
                  Entrar como Admin
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-purple-500/20">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate("/login")}
              className="w-full h-10 rounded-xl text-purple-300 hover:text-purple-100 hover:bg-slate-700/30"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao login normal
            </Button>
          </div>
        </div>

        <p className="text-center text-purple-300/60 text-sm mt-6 animate-fade-in delay-500">
          Acesso restrito a administradores autorizados
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
