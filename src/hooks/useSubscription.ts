import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ActiveSubscription {
  id: string;
  plan_id: string;
  billing_period: string;
  status: string;
  started_at: string;
  expires_at: string;
}

export function useSubscription(userId: string | undefined) {
  const [subscription, setSubscription] = useState<ActiveSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = async () => {
    if (!userId) { setLoading(false); return; }

    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    setSubscription(data as ActiveSubscription | null);
    setLoading(false);
  };

  useEffect(() => {
    fetchSubscription();
  }, [userId]);

  const createPayment = async (planId: string, billingPeriod: 'monthly' | 'quarterly') => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Not authenticated');

    const resp = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ planId, billingPeriod }),
      }
    );

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: 'Payment error' }));
      throw new Error(err.error || 'Payment failed');
    }

    const { confirmationUrl } = await resp.json();
    return confirmationUrl as string;
  };

  return { subscription, loading, createPayment, refreshSubscription: fetchSubscription };
}
