import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Crown, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function JoinManager() {
  const { celebrityId } = useParams();
  const { user, loading } = useAuth();
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  const [celeb, setCeleb] = useState<{ display_name: string | null; username: string | null } | null>(null);
  const [joining, setJoining] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate(`/?redirect=/join-manager/${celebrityId}`);
  }, [user, loading, celebrityId, navigate]);

  useEffect(() => {
    if (!celebrityId) return;
    supabase.from('profiles').select('display_name, username').eq('id', celebrityId).maybeSingle()
      .then(({ data }) => setCeleb(data as any));
  }, [celebrityId]);

  const accept = async () => {
    if (!user || !celebrityId) return;
    if (user.id === celebrityId) { toast.error(isRTL ? 'لا يمكنك إدارة نفسك' : "You can't manage yourself"); return; }
    setJoining(true);
    const { error } = await supabase
      .from('manager_links')
      .upsert({ celebrity_id: celebrityId, manager_id: user.id, status: 'active' } as any, { onConflict: 'celebrity_id,manager_id' });
    setJoining(false);
    if (error) { toast.error(isRTL ? 'فشل الانضمام' : 'Failed to join'); return; }
    setDone(true);
    toast.success(isRTL ? 'أصبحت وكيلاً الآن' : 'You are now a manager');
    setTimeout(() => navigate('/home'), 1200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-sm w-full text-center space-y-5">
        <div className="h-16 w-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto">
          <Crown className="h-8 w-8 text-amber-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold">{isRTL ? 'دعوة لتكون وكيلاً' : 'Manager Invitation'}</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {isRTL ? 'لإدارة صندوق العمل الخاص بـ' : "To manage the Business box of"}{' '}
            <span className="font-semibold text-foreground">@{celeb?.username || celeb?.display_name || '...'}</span>
          </p>
        </div>
        {done ? (
          <div className="flex items-center justify-center gap-2 text-emerald-600">
            <Check className="h-5 w-5" /> {isRTL ? 'تم!' : 'Done!'}
          </div>
        ) : (
          <Button onClick={accept} disabled={joining || loading} className="w-full h-12 rounded-2xl glow-gold">
            {joining ? <Loader2 className="h-5 w-5 animate-spin" /> : isRTL ? 'قبول وأصبح وكيلاً' : 'Accept & Become Manager'}
          </Button>
        )}
      </div>
    </div>
  );
}
