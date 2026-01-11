import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Upload, Image, Video, X, Save, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface LoginSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Settings {
  login_background_type: string;
  login_background_url: string | null;
  logo_url: string | null;
}

const LoginSettingsDialog = ({ open, onOpenChange }: LoginSettingsDialogProps) => {
  const [settings, setSettings] = useState<Settings>({
    login_background_type: 'none',
    login_background_url: null,
    logo_url: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBackground, setUploadingBackground] = useState(false);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      fetchSettings();
    }
  }, [open]);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('app_settings')
      .select('key, value');

    if (error) {
      toast.error("Erro ao carregar configurações");
      setLoading(false);
      return;
    }

    const settingsMap: Record<string, string | null> = {};
    data?.forEach(item => {
      settingsMap[item.key] = item.value;
    });

    setSettings({
      login_background_type: settingsMap['login_background_type'] || 'none',
      login_background_url: settingsMap['login_background_url'] || null,
      logo_url: settingsMap['logo_url'] || null,
    });
    setLoading(false);
  };

  const updateSetting = async (key: string, value: string | null) => {
    const { error } = await supabase
      .from('app_settings')
      .update({ value })
      .eq('key', key);

    if (error) {
      throw error;
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error("Formato inválido. Use JPG, PNG ou WEBP.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 5MB.");
      return;
    }

    setUploadingLogo(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('login-assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('login-assets')
        .getPublicUrl(fileName);

      setSettings(prev => ({ ...prev, logo_url: urlData.publicUrl }));
      toast.success("Logo carregado com sucesso!");
    } catch (error) {
      toast.error("Erro ao fazer upload do logo");
      console.error(error);
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imageTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const videoTypes = ['video/mp4', 'video/webm'];
    const validTypes = [...imageTypes, ...videoTypes];

    if (!validTypes.includes(file.type)) {
      toast.error("Formato inválido. Use JPG, PNG, WEBP, MP4 ou WEBM.");
      return;
    }

    const maxSize = videoTypes.includes(file.type) ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`Arquivo muito grande. Máximo ${videoTypes.includes(file.type) ? '50MB' : '10MB'}.`);
      return;
    }

    setUploadingBackground(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `background-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('login-assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('login-assets')
        .getPublicUrl(fileName);

      const isVideo = videoTypes.includes(file.type);
      setSettings(prev => ({
        ...prev,
        login_background_type: isVideo ? 'video' : 'image',
        login_background_url: urlData.publicUrl,
      }));
      toast.success("Fundo carregado com sucesso!");
    } catch (error) {
      toast.error("Erro ao fazer upload do fundo");
      console.error(error);
    } finally {
      setUploadingBackground(false);
      if (backgroundInputRef.current) backgroundInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      await updateSetting('login_background_type', settings.login_background_type);
      await updateSetting('login_background_url', settings.login_background_url);
      await updateSetting('logo_url', settings.logo_url);

      toast.success("Configurações salvas com sucesso!");
      onOpenChange(false);
    } catch (error) {
      toast.error("Erro ao salvar configurações");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveLogo = () => {
    setSettings(prev => ({ ...prev, logo_url: null }));
  };

  const handleRemoveBackground = () => {
    setSettings(prev => ({
      ...prev,
      login_background_type: 'none',
      login_background_url: null,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-gold" />
            Personalizar Tela de Login
          </DialogTitle>
          <DialogDescription>
            Configure o visual da tela de login para todos os usuários.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Logo Section */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold flex items-center gap-2">
                <Image className="h-5 w-5" />
                Logo
              </Label>
              <p className="text-sm text-muted-foreground">
                Substitui o texto "TI" na tela de login.
              </p>
              
              <div className="flex items-start gap-4">
                {/* Preview */}
                <div className="w-24 h-24 bg-gold rounded-2xl flex items-center justify-center overflow-hidden shrink-0">
                  {settings.logo_url ? (
                    <img
                      src={settings.logo_url}
                      alt="Logo preview"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-3xl font-bold text-primary">TI</span>
                  )}
                </div>
                
                <div className="flex flex-col gap-2 flex-1">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="w-full"
                  >
                    {uploadingLogo ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {uploadingLogo ? 'Enviando...' : 'Enviar Logo'}
                  </Button>
                  {settings.logo_url && (
                    <Button
                      variant="ghost"
                      onClick={handleRemoveLogo}
                      className="text-destructive"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remover Logo
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Formatos: JPG, PNG, WEBP. Máx: 5MB
                  </p>
                </div>
              </div>
            </div>

            {/* Background Section */}
            <div className="space-y-4 border-t pt-6">
              <Label className="text-lg font-semibold flex items-center gap-2">
                <Video className="h-5 w-5" />
                Fundo da Tela
              </Label>
              <p className="text-sm text-muted-foreground">
                Define a imagem ou vídeo de fundo da tela de login.
              </p>

              {/* Background Type Radio */}
              <RadioGroup
                value={settings.login_background_type}
                onValueChange={(value) => setSettings(prev => ({ ...prev, login_background_type: value }))}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="none" id="bg-none" />
                  <Label htmlFor="bg-none" className="cursor-pointer">Sem fundo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="image" id="bg-image" />
                  <Label htmlFor="bg-image" className="cursor-pointer">Imagem</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="video" id="bg-video" />
                  <Label htmlFor="bg-video" className="cursor-pointer">Vídeo</Label>
                </div>
              </RadioGroup>

              {/* Background Preview */}
              {settings.login_background_url && settings.login_background_type !== 'none' && (
                <div className="relative w-full h-48 rounded-xl overflow-hidden bg-muted">
                  {settings.login_background_type === 'video' ? (
                    <video
                      src={settings.login_background_url}
                      className="w-full h-full object-cover"
                      autoPlay
                      muted
                      loop
                      playsInline
                    />
                  ) : (
                    <img
                      src={settings.login_background_url}
                      alt="Background preview"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  ref={backgroundInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.mp4,.webm"
                  onChange={handleBackgroundUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => backgroundInputRef.current?.click()}
                  disabled={uploadingBackground}
                  className="flex-1"
                >
                  {uploadingBackground ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  {uploadingBackground ? 'Enviando...' : 'Enviar Imagem/Vídeo'}
                </Button>
                {settings.login_background_url && (
                  <Button
                    variant="ghost"
                    onClick={handleRemoveBackground}
                    className="text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Imagens: JPG, PNG, WEBP (máx 10MB). Vídeos: MP4, WEBM (máx 50MB)
              </p>
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-gold hover:bg-gold/90 text-gold-foreground"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar Alterações
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LoginSettingsDialog;
