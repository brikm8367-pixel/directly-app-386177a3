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
  deal_type_other: string | null;
  company_name: string | null;
  website: string | null;
  campaign_description: string | null;
  budget_amount: number | null;
  budget_cycle: string | null;
  budget_cycle_other: string | null;
  commitments: string[] | null;
  commitment_other: string | null;
  duration: string | null;
  duration_date: string | null;
  exclusivity: string | null;
  exclusivity_category: string | null;
  why_talent: string | null;
  details: string | null;
  status: DealStatus;
  seen_at: string | null;
  decline_reason: string | null;
  shared_with_talent_at: string | null;
  created_at: string;
  sender_profile?: { id: string; display_name: string | null; username: string | null; avatar_url: string | null };
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

    setDeals(withProfiles);
    setLoading(false);
  }, [celebrityId, user]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: DealStatus, extra?: { decline_reason?: string }) => {
    const payload: any = { status };
    if (extra?.decline_reason) payload.decline_reason = extra.decline_reason;
    await (supabase as any).from('deal_cards').update(payload).eq('id', id);
    load();
  };

  const markSeen = async (id: string) => {
    await (supabase as any).from('deal_cards').update({ seen_at: new Date().toISOString() }).eq('id', id).is('seen_at', null);
  };

  const shareWithTalent = async (deal: DealCard) => {
    // Copy card to the celebrity's Private box as a message referencing the same deal.
    await (supabase as any).from('deal_cards').update({ shared_with_talent_at: new Date().toISOString() }).eq('id', deal.id);
    await supabase.from('messages').insert({
      sender_id: deal.sender_id,
      receiver_id: deal.celebrity_id,
      category: 'direct',
      subject: 'Deal Card (shared by manager)',
      content: `Deal from ${deal.company_name ?? 'a company'} — ${deal.deal_type}`,
    } as any);
    load();
  };

  return { deals, loading, refresh: load, updateStatus, markSeen, shareWithTalent };
}
