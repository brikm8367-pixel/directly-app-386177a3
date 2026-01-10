import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Bell, Check, User, MessageSquare, AlertTriangle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS, fr, es } from 'date-fns/locale';

interface Notification {
  id: string;
  type: 'new_message' | 'inbox_full';
  title: string;
  message: string;
  sender_name?: string;
  sender_avatar?: string;
  category?: string;
  created_at: string;
  is_read: boolean;
}

interface NotificationsPanelProps {
  onNotificationClick?: () => void;
}

export function NotificationsPanel({ onNotificationClick }: NotificationsPanelProps) {
  const { user } = useAuth();
  const { t, isRTL, language } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const getLocale = () => {
    switch (language) {
      case 'ar': return ar;
      case 'fr': return fr;
      case 'es': return es;
      default: return enUS;
    }
  };

  // Fetch unread messages as notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;

      const { data: messages } = await supabase
        .from('messages')
        .select(`
          id,
          subject,
          content,
          category,
          created_at,
          is_read,
          sender_id
        `)
        .eq('receiver_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(20);

      if (messages) {
        // Get sender profiles
        const senderIds = [...new Set(messages.map(m => m.sender_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .in('id', senderIds);

        const notifs: Notification[] = messages.map(msg => {
          const sender = profiles?.find(p => p.id === msg.sender_id);
          return {
            id: msg.id,
            type: 'new_message',
            title: `${t.notifications.newMessage} ${sender?.display_name || 'مستخدم'}`,
            message: msg.subject || msg.content.slice(0, 50) + '...',
            sender_name: sender?.display_name || undefined,
            sender_avatar: sender?.avatar_url || undefined,
            category: msg.category,
            created_at: msg.created_at,
            is_read: msg.is_read || false,
          };
        });

        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.is_read).length);
      }
    };

    fetchNotifications();

    // Realtime subscription for new messages
    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user?.id}`,
      }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, t.notifications.newMessage]);

  const markAllAsRead = async () => {
    if (!user) return;

    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('receiver_id', user.id)
      .eq('is_read', false);

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'work': return 'bg-work text-white';
      case 'audience': return 'bg-audience text-white';
      case 'direct': return 'bg-others text-white';
      default: return 'bg-muted';
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -end-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side={isRTL ? 'right' : 'left'} className="w-[340px] sm:w-[400px]">
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {t.notifications.title}
            </SheetTitle>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
                <Check className="h-3 w-3 me-1" />
                {t.notifications.markAllRead}
              </Button>
            )}
          </div>
          {/* Feature Description */}
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
            <Info className="h-3 w-3" />
            {t.featureDescriptions.notifications}
          </p>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] pt-4">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mb-4 opacity-50" />
              <p>{t.notifications.empty}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50 ${
                    !notif.is_read ? 'bg-primary/5 border-primary/20' : 'border-border'
                  }`}
                  onClick={() => {
                    setIsOpen(false);
                    onNotificationClick?.();
                  }}
                >
                  <div className="flex items-start gap-3">
                    {notif.type === 'new_message' ? (
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={notif.sender_avatar || undefined} />
                        <AvatarFallback>
                          {notif.sender_name?.[0] || <User className="h-4 w-4" />}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm truncate">{notif.title}</p>
                        {notif.category && (
                          <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${getCategoryColor(notif.category)}`}>
                            {notif.category}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{notif.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: getLocale() })}
                      </p>
                    </div>
                    {!notif.is_read && (
                      <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
