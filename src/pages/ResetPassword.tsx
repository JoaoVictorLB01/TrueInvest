import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, CheckCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLoginSettings } from "@/hooks/useLoginSettings";
import { z } from "zod";

const resetPasswordSchema = z.object({
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();
  const { settings: loginSettings, loading: settingsLoading } = useLoginSettings();

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event from Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth event:", event);
        
        if (event === "PASSWORD_RECOVERY") {
          // User clicked the recovery link - they can now set a new password
          setReady(true);
          setError(null);
        } else if (event === "SIGNED_IN" && !ready && !success) {
          // If user is already signed in normally, redirect to dashboard
          // But only if we haven't processed a PASSWORD_RECOVERY event
        }
      }
    );

    // Check URL hash for recovery token (Supabase sends tokens via hash)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');
    
    if (accessToken && type === 'recovery') {
      // Token is present in URL, Supabase will process it via onAuthStateChange
      // Just wait for the PASSWORD_RECOVERY event
      console.log("Recovery token found in URL");
    } else {
      // No token in URL - check if we already have a recovery session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          // User has a valid session, allow password reset
          setReady(true);
        } else {
          // No session and no token - show error after a brief delay
          setTimeout(() => {
            if (!ready) {
              setError("Link inválido ou expirado");
            }
          }, 2000);
        }
      });
    }

    return () => subscription.unsubscribe();
  }, [ready, success]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = resetPasswordSchema.safeParse({ password, confirmPassword });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setLoading(true);
    
    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

    setLoading(false);

    if (updateError) {
      console.error("Password reset error:", updateError);
      if (updateError.message.includes("same as")) {
        toast.error("A nova senha deve ser diferente da senha atual");
      } else {
        toast.error("Erro ao redefinir senha. Tente novamente.");
      }
      return;
    }

    setSuccess(true);
    toast.success("Senha redefinida com sucesso!");
    
    // Sign out after password reset so user can login with new password
    await supabase.auth.signOut();
    
    // Redirect to login after 3 seconds
    setTimeout(() => {
      navigate("/login");
    }, 3000);
  };

  if (settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-primary">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  const hasBackground = loginSettings.login_background_type !== 'none' && loginSettings.login_background_url;

  // Show error state if link is invalid
  if (error && !ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-primary p-4 relative overflow-hidden">
        {hasBackground && (
          <div className="absolute inset-0 z-0">
            {loginSettings.login_background_type === 'video' ? (
              <video
                src={loginSettings.login_background_url!}
                className="w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
              />
            ) : (
              <img
                src={loginSettings.login_background_url!}
                alt="Background"
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-primary/80" />
          </div>
        )}

        <div className="w-full max-w-md animate-fade-in relative z-10">
          <div className="text-center mb-8">
            <div className="inline-block mb-6">
              <div className="w-20 h-20 bg-gold rounded-2xl flex items-center justify-center shadow-gold animate-bounce-in overflow-hidden">
                {loginSettings.logo_url ? (
                  <img
                    src={loginSettings.logo_url}
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-3xl font-bold text-primary">TI</span>
                )}
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 animate-slide-up">True Invest</h1>
          </div>

          <div className="bg-card rounded-3xl p-8 shadow-xl animate-scale-in text-center">
            <h2 className="text-xl font-semibold text-foreground mb-4">Link Inválido ou Expirado</h2>
            <p className="text-muted-foreground mb-6">
              Este link de recuperação de senha é inválido ou já expirou. Solicite um novo link na tela de login.
            </p>
            <Button 
              onClick={() => navigate("/login")}
              className="w-full h-12 rounded-xl bg-gold hover:bg-gold/90 text-gold-foreground font-semibold transition-smooth shadow-gold hover-lift press-effect"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Voltar para o Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while waiting for auth state
  if (!ready && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-primary">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gold mx-auto mb-4" />
          <p className="text-white/80">Validando link de recuperação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-primary p-4 relative overflow-hidden">
      {hasBackground && (
        <div className="absolute inset-0 z-0">
          {loginSettings.login_background_type === 'video' ? (
            <video
              src={loginSettings.login_background_url!}
              className="w-full h-full object-cover"
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <img
              src={loginSettings.login_background_url!}
              alt="Background"
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-primary/80" />
        </div>
      )}

      <div className="w-full max-w-md animate-fade-in relative z-10">
        <div className="text-center mb-8">
          <div className="inline-block mb-6">
            <div className="w-20 h-20 bg-gold rounded-2xl flex items-center justify-center shadow-gold animate-bounce-in overflow-hidden">
              {loginSettings.logo_url ? (
                <img
                  src={loginSettings.logo_url}
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-3xl font-bold text-primary">TI</span>
              )}
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 animate-slide-up">True Invest</h1>
          <p className="text-white/80 animate-slide-up delay-100">Redefinir Senha</p>
        </div>

        <div className="bg-card rounded-3xl p-8 shadow-xl animate-scale-in">
          {success ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Senha Redefinida!</h2>
              <p className="text-muted-foreground">
                Sua senha foi alterada com sucesso. Você será redirecionado para a tela de login.
              </p>
              <Loader2 className="h-5 w-5 animate-spin mx-auto text-gold" />
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-foreground">Nova Senha</h2>
                <p className="text-muted-foreground text-sm mt-2">
                  Digite sua nova senha abaixo
                </p>
              </div>

              <div className="space-y-2 opacity-0-animate animate-slide-up">
                <Label htmlFor="password" className="text-foreground flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  Nova Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-xl"
                  disabled={loading}
                  autoFocus
                />
              </div>

              <div className="space-y-2 opacity-0-animate animate-slide-up delay-100">
                <Label htmlFor="confirm-password" className="text-foreground flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  Confirmar Nova Senha
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Repita sua nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                  "Redefinir Senha"
                )}
              </Button>

              <Button 
                type="button"
                variant="ghost"
                onClick={() => navigate("/login")}
                className="w-full h-10 rounded-xl text-sm transition-smooth opacity-0-animate animate-fade-in delay-300"
                disabled={loading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para o Login
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
