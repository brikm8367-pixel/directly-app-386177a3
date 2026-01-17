import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, ArrowRight, Bell, BellOff, Inbox, AlertTriangle,
  MessageSquare, Settings, Check, Loader2, Crown
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'inbox_full' | 'new_message' | 'limit_warning' | 'direct_access';
  title: string;
  message: string;
  category?: string;
  isRead: boolean;
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
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // Fetch message counts
      const { data: messages } = await supabase
        .from('messages')
        .select('category')
        .eq('receiver_id', user.id);

      // Fetch limits
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

      // Generate notifications based on limits
      const newNotifications: Notification[] = [];

      // Check for full inboxes
      (['work', 'audience', 'direct'] as const).forEach(category => {
        const { current, max } = newLimits[category];
        const categoryNames = {
          work: isRTL ? 'صندوق العمل' : 'Work inbox',
          audience: isRTL ? 'صندوق الجمهور' : 'Audience inbox',
          direct: isRTL ? 'صندوق المباشر' : 'Direct inbox',
        };

        if (current >= max) {
          newNotifications.push({
            id: `full-${category}`,
            type: 'inbox_full',
            title: isRTL ? '📦 صندوق ممتلئ' : '📦 Inbox Full',
            message: isRTL 
              ? `${categoryNames[category]} امتلأ (${current}/${max}). زِد الحد لاستقبال رسائل جديدة.`
              : `${categoryNames[category]} is full (${current}/${max}). Increase limit to receive new messages.`,
            category,
            isRead: false,
            createdAt: new Date(),
          });
        } else if (current >= max * 0.8) {
          newNotifications.push({
            id: `warning-${category}`,
            type: 'limit_warning',
            title: isRTL ? '⚠️ اقترب الامتلاء' : '⚠️ Almost Full',
            message: isRTL
              ? `${categoryNames[category]} يقترب من الامتلاء (${current}/${max}).`
              : `${categoryNames[category]} is almost full (${current}/${max}).`,
            category,
            isRead: false,
            createdAt: new Date(),
          });
        }
      });

      setNotifications(newNotifications);
      setIsLoading(false);
    };

    if (user) fetchData();
  }, [user, isRTL]);

  const handleIncreaseLimit = (category: string) => {
    navigate('/home');
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="fixed top-0 right-0 left-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto flex h-16 items-center justify-between px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/home')}
            className="h-11 w-11 rounded-xl touch-feedback"
          >
            <BackIcon className="h-5 w-5" />
          </Button>
          <h1 className="font-bold text-lg flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            {isRTL ? 'الإشعارات' : 'Notifications'}
          </h1>
          <div className="w-11" />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto pt-24 pb-8 px-4">
        {/* Status Card */}
        <div className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-primary/20 flex items-center justify-center">
              <Crown className="h-7 w-7 text-primary animate-crown" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg text-foreground">
                {isRTL ? 'حالة صناديقك' : 'Your Inbox Status'}
              </p>
              <p className="text-sm text-muted-foreground">
                {notifications.length === 0
                  ? (isRTL ? 'كل شيء تحت السيطرة ✨' : 'Everything under control ✨')
                  : (isRTL ? `${notifications.length} تنبيهات تحتاج انتباهك` : `${notifications.length} alerts need attention`)
                }
              </p>
            </div>
          </div>
        </div>

        {/* Inbox Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {(['work', 'audience', 'direct'] as const).map(category => {
            const { current, max } = limits[category];
            const percentage = (current / max) * 100;
            const isFull = current >= max;
            const isWarning = percentage >= 80;
            
            const categoryIcons = {
              work: '💼',
              audience: '👥',
              direct: '⭐',
            };
            const categoryNames = {
              work: isRTL ? 'العمل' : 'Work',
              audience: isRTL ? 'الجمهور' : 'Audience',
              direct: isRTL ? 'المباشر' : 'Direct',
            };

            return (
              <div
                key={category}
                className={`p-4 rounded-2xl border ${
                  isFull 
                    ? 'bg-destructive/10 border-destructive/30' 
                    : isWarning 
                      ? 'bg-yellow-500/10 border-yellow-500/30'
                      : 'bg-card border-border'
                }`}
              >
                <div className="text-2xl mb-2">{categoryIcons[category]}</div>
                <p className="text-xs text-muted-foreground">{categoryNames[category]}</p>
                <p className="font-bold text-lg">
                  {current}/{max}
                </p>
                <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      isFull ? 'bg-destructive' : isWarning ? 'bg-yellow-500' : 'bg-primary'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Check className="h-10 w-10 text-primary" />
            </div>
            <p className="text-xl font-semibold text-foreground mb-2">
              {isRTL ? 'لا توجد إشعارات' : 'No Notifications'}
            </p>
            <p className="text-muted-foreground">
              {isRTL ? 'صناديقك منظمة ومرتبة ✨' : 'Your inboxes are organized ✨'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(notification => (
              <div
                key={notification.id}
                className={`p-4 rounded-2xl border ${
                  notification.type === 'inbox_full'
                    ? 'bg-destructive/5 border-destructive/20'
                    : 'bg-yellow-500/5 border-yellow-500/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                    notification.type === 'inbox_full' 
                      ? 'bg-destructive/20' 
                      : 'bg-yellow-500/20'
                  }`}>
                    {notification.type === 'inbox_full' ? (
                      <Inbox className="h-5 w-5 text-destructive" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{notification.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                    
                    {notification.category && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleIncreaseLimit(notification.category!)}
                        className="mt-3 h-9 rounded-xl"
                      >
                        <Settings className="h-4 w-4 me-2" />
                        {isRTL ? 'تعديل الحد' : 'Adjust Limit'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Help Text */}
        <div className="mt-8 p-4 rounded-2xl bg-muted/50 border border-border">
          <p className="text-sm text-muted-foreground text-center">
            {isRTL 
              ? '💡 عندما يمتلئ صندوق، لن يتمكن أحد من إرسال رسائل جديدة لك حتى تزيد الحد أو تحذف رسائل.'
              : "💡 When an inbox is full, no one can send you new messages until you increase the limit or delete messages."
            }
          </p>
        </div>
      </main>
    </div>
  );
}
