import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type DealStatus = 'pending' | 'accepted' | 'declined' | 'countered';

export interface DealCard {
  id: string;
  sender_id: string;
  celebrity_id: string;
  message_id: string | null;
  deal_type: string;
  budget_range: string | null;
  timeline: string | null;
  details: string | null;
  status: DealStatus;
  golden_hour: boolean;
  golden_hour_expires_at: string | null;
  created_at: string;
  sender_profile?: { id: string; display_name: string | null; username: string | null; avatar_url: string | null };
}

function isGoldenActive(d: DealCard) {
  return d.golden_hour && d.golden_hour_expires_at != null && new Date(d.golden_hour_expires_at).getTime() > Date.now();
}

/** Deal cards addressed to a celebrity (visible to celebrity + active manager). */
export function useDealCards(celebrityId?: string | null) {
  const { user } = useAuth();
  const [deals, setDeals] = useState<DealCard[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const target = celebrityId ?? user?.id;
    if (!target) { setDeals([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await (supabase as any)
      .from('deal_cards')
      .select('*')
      .eq('celebrity_id', target)
      .order('created_at', { ascending: false });

    const rows: DealCard[] = data ?? [];
    const ids = [...new Set(rows.map(r => r.sender_id))];
    let profiles: any[] = [];
    if (ids.length) {
      const { data: p } = await supabase.from('profiles').select('id, display_name, username, avatar_url').in('id', ids);
      profiles = p ?? [];
    }
    const withProfiles = rows.map(r => ({ ...r, sender_profile: profiles.find(p => p.id === r.sender_id) }));

    // Golden Hour active first, then newest.
    withProfiles.sort((a, b) => {
      const ga = isGoldenActive(a) ? 1 : 0;
      const gb = isGoldenActive(b) ? 1 : 0;
      if (ga !== gb) return gb - ga;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    setDeals(withProfiles);
    setLoading(false);
  }, [celebrityId, user]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: DealStatus) => {
    await (supabase as any).from('deal_cards').update({ status }).eq('id', id);
    load();
  };

  return { deals, loading, refresh: load, updateStatus, isGoldenActive };
}
