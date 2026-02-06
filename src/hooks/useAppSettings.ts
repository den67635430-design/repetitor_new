import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useAppSettings() {
  const [testMode, setTestMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch initial test mode state
  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'test_mode')
        .maybeSingle();

      if (data?.value && typeof data.value === 'object' && 'enabled' in data.value) {
        setTestMode((data.value as { enabled: boolean }).enabled);
      }
      setLoading(false);
    };

    fetchSettings();

    // Subscribe to realtime changes for instant broadcast
    const channel = supabase
      .channel('app_settings_realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'app_settings',
          filter: 'key=eq.test_mode',
        },
        (payload) => {
          const value = payload.new?.value;
          if (value && typeof value === 'object' && 'enabled' in value) {
            setTestMode((value as { enabled: boolean }).enabled);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Toggle test mode (admin only — RLS enforces this)
  const toggleTestMode = useCallback(async () => {
    const newValue = !testMode;
    const { error } = await supabase
      .from('app_settings')
      .update({
        value: { enabled: newValue } as any,
        updated_at: new Date().toISOString(),
        updated_by: (await supabase.auth.getUser()).data.user?.id || null,
      })
      .eq('key', 'test_mode');

    if (!error) {
      setTestMode(newValue);
    }
  }, [testMode]);

  return { testMode, loading: loading, toggleTestMode };
}
