import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LoginSettings {
  login_background_type: string;
  login_background_url: string | null;
  logo_url: string | null;
}

export const useLoginSettings = () => {
  const [settings, setSettings] = useState<LoginSettings>({
    login_background_type: 'none',
    login_background_url: null,
    logo_url: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('key, value');

      if (error) {
        console.error('Error fetching login settings:', error);
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
    } catch (error) {
      console.error('Error fetching login settings:', error);
    } finally {
      setLoading(false);
    }
  };

  return { settings, loading, refetch: fetchSettings };
};
