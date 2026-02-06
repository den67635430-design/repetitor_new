import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AdminStats {
  totalUsers: number;
  todayRegistrations: number;
  totalSessions: number;
  activeDevices: number;
  topSubject: string;
  totalMessages: number;
}

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    todayRegistrations: 0,
    totalSessions: 0,
    activeDevices: 0,
    topSubject: '—',
    totalMessages: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    // Run all queries in parallel
    const [
      profilesRes,
      todayProfilesRes,
      sessionsRes,
      devicesRes,
      messagesRes,
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', todayISO),
      supabase.from('chat_sessions').select('id, subject'),
      supabase.from('device_sessions').select('id', { count: 'exact', head: true }),
      supabase.from('chat_messages').select('id', { count: 'exact', head: true }),
    ]);

    // Calculate top subject
    let topSubject = '—';
    if (sessionsRes.data && sessionsRes.data.length > 0) {
      const subjectCounts: Record<string, number> = {};
      for (const s of sessionsRes.data) {
        subjectCounts[s.subject] = (subjectCounts[s.subject] || 0) + 1;
      }
      const sorted = Object.entries(subjectCounts).sort((a, b) => b[1] - a[1]);
      if (sorted.length > 0) topSubject = sorted[0][0];
    }

    setStats({
      totalUsers: profilesRes.count ?? 0,
      todayRegistrations: todayProfilesRes.count ?? 0,
      totalSessions: sessionsRes.data?.length ?? 0,
      activeDevices: devicesRes.count ?? 0,
      topSubject,
      totalMessages: messagesRes.count ?? 0,
    });

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStats();

    // Subscribe to realtime updates on profiles for instant refresh
    const channel = supabase
      .channel('admin_stats_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, () => fetchStats())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_sessions' }, () => fetchStats())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'device_sessions' }, () => fetchStats())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchStats]);

  return { stats, loading, refresh: fetchStats };
}
