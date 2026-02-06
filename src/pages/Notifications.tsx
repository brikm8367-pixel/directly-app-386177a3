import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { BottomNavigation } from '@/components/BottomNavigation';
import { 
  Bell, Inbox, Check, Loader2, Settings
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'inbox_full' | 'limit_warning';
  title: string;
  message: string;
  category?: string;
  createdAt: Date;
}

interface MessageLimits {
  work: { current: number; max: number };
  audience: { current: number; max: number };
  direct: { current: number; max: number };
}

export default function NotificationsPage() {
  const { user, loading } = useAuth();
  const { isRTL } = useLanguage();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [limits, setLimits] = useState<MessageLimits>({
    work: { current: 0, max: 100 },
    audience: { current: 0, max: 100 },
    direct: { current: 0, max: 100 },
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate('/');
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const { data: messages } = await supabase
        .from('messages')
        .select('category')
        .eq('receiver_id', user.id);

      const { data: limitsData } = await supabase
        .from('message_limits')
        .select('category, max_messages')
        .eq('user_id', user.id);

      const newLimits: MessageLimits = {
        work: { current: 0, max: 100 },
        audience: { current: 0, max: 100 },
        direct: { current: 0, max: 100 },
      };

      if (messages) {
        messages.forEach(m => {
          if (m.category === 'work') newLimits.work.current++;
          if (m.category === 'audience') newLimits.audience.current++;
          if (m.category === 'direct') newLimits.direct.current++;
        });
      }

      if (limitsData) {
        limitsData.forEach(l => {
          if (l.category === 'work') newLimits.work.max = l.max_messages || 100;
          if (l.category === 'audience') newLimits.audience.max = l.max_messages || 100;
          if (l.category === 'direct') newLimits.direct.max = l.max_messages || 100;
        });
      }

      setLimits(newLimits);

      // Generate soft notifications
      const newNotifications: Notification[] = [];
      const categoryNames = {
        work: isRTL ? 'العمل' : 'Work',
        audience: isRTL ? 'الجمهور' : 'Audience',
        direct: isRTL ? 'الخاص' : 'Private',
      };

      (['work', 'audience', 'direct'] as const).forEach(category => {
        const { current, max } = newLimits[category];
        if (current >= max) {
          newNotifications.push({
            id: `full-${category}`,
            type: 'inbox_full',
            title: isRTL ? `صندوق ${categoryNames[category]} امتلأ` : `${categoryNames[category]} inbox is full`,
            message: isRTL 
              ? `إذا أردت استقبال رسائل جديدة، يمكنك زيادة الحد.`
              : `To receive new messages, you can increase the limit.`,
            category,
            createdAt: new Date(),
          });
        }
      });

      setNotifications(newNotifications);
      setIsLoading(false);
    };

    if (user) fetchData();
  }, [user, isRTL]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="fixed top-0 right-0 left-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border safe-area-inset-top">
        <div className="max-w-lg mx-auto flex h-14 items-center justify-center px-4">
          <h1 className="font-bold text-lg flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            {isRTL ? 'الإشعارات' : 'Notifications'}
          </h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto pt-16 pb-20 px-4">
        {/* Inbox Status - Gentle, non-aggressive */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {(['work', 'audience', 'direct'] as const).map(category => {
            const { current, max } = limits[category];
            const percentage = Math.min((current / max) * 100, 100);
            const icons = { work: '💼', audience: '👥', direct: '⭐' };
            const names = {
              work: isRTL ? 'العمل' : 'Work',
              audience: isRTL ? 'الجمهور' : 'Audience',
              direct: isRTL ? 'الخاص' : 'Private',
            };

            return (
              <div key={category} className="p-3 rounded-2xl bg-card border border-border text-center">
                <div className="text-xl mb-1">{icons[category]}</div>
                <p className="text-xs text-muted-foreground">{names[category]}</p>
                <p className="font-bold text-lg">{current}<span className="text-xs text-muted-foreground font-normal">/{max}</span></p>
                <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary transition-all rounded-full" style={{ width: `${percentage}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Notifications */}
        {notifications.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-primary" />
            </div>
            <p className="text-lg font-semibold mb-1">
              {isRTL ? 'كل شيء منظم' : 'Everything organized'}
            </p>
            <p className="text-sm text-muted-foreground">
              {isRTL ? 'لا توجد إشعارات حالياً ✨' : 'No notifications right now ✨'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(notification => (
              <div key={notification.id} className="p-4 rounded-2xl bg-card border border-border">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Inbox className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{notification.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{notification.message}</p>
                    {notification.category && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate('/home')}
                        className="mt-3 h-9 rounded-xl text-xs"
                      >
                        <Settings className="h-3.5 w-3.5 me-1.5" />
                        {isRTL ? 'تعديل الحد' : 'Adjust Limit'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}
