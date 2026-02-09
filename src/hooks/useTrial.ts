import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const TRIAL_DAYS = 10;

export interface TrialInfo {
  hasTrialStarted: boolean;
  isTrialActive: boolean;
  trialDaysLeft: number;
  trialExpiresAt: string | null;
}

export function useTrial(userId: string | undefined) {
  const [trial, setTrial] = useState<TrialInfo>({
    hasTrialStarted: false,
    isTrialActive: false,
    trialDaysLeft: 0,
    trialExpiresAt: null,
  });
  const [loading, setLoading] = useState(true);

  const fetchTrial = useCallback(async () => {
    if (!userId) { setLoading(false); return; }

    const { data } = await supabase
      .from('profiles')
      .select('trial_started_at, trial_expires_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (data?.trial_started_at) {
      const expiresAt = new Date(data.trial_expires_at as string);
      const now = new Date();
      const daysLeft = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

      setTrial({
        hasTrialStarted: true,
        isTrialActive: now < expiresAt,
        trialDaysLeft: daysLeft,
        trialExpiresAt: data.trial_expires_at,
      });
    } else {
      setTrial({ hasTrialStarted: false, isTrialActive: false, trialDaysLeft: 0, trialExpiresAt: null });
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchTrial(); }, [fetchTrial]);

  const startTrial = async () => {
    if (!userId) return;
    const now = new Date();
    const expires = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

    await supabase
      .from('profiles')
      .update({
        trial_started_at: now.toISOString(),
        trial_expires_at: expires.toISOString(),
      })
      .eq('user_id', userId);

    await fetchTrial();
  };

  return { trial, loading, startTrial, refreshTrial: fetchTrial };
}
