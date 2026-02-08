import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Briefcase, Users, Heart, Settings2, Mail, MailOpen } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export type MessageCategory = 'work' | 'audience' | 'direct';

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  category: MessageCategory;
  parent_id: string | null;
  sender_profile?: {
    id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
  subject: string | null;
  content: string;
  is_important: boolean;
  is_read: boolean;
  created_at: string;
  voice_url?: string | null;
}

interface InboxSectionProps {
  category: MessageCategory;
  messages: Message[];
  messageLimit: number;
  onSetLimit: (limit: number) => void;
  onMessageClick: (message: Message) => void;
  isLoading?: boolean;
  isOnline?: (userId: string) => boolean;
}

const categoryConfig = {
  work: {
    icon: Briefcase,
    label: { ar: 'العمل', en: 'Work' },
    subtitle: { ar: 'رسائل مهنية', en: 'Professional' },
  },
  audience: {
    icon: Users,
    label: { ar: 'الدائرة', en: 'Audience' },
    subtitle: { ar: 'تواصل مفتوح', en: 'Open messages' },
  },
  direct: {
    icon: Heart,
    label: { ar: 'الخاص', en: 'Private' },
    subtitle: { ar: 'المقربون', en: 'Close contacts' },
  },
};

export default function InboxSection({
  category,
  messages,
  messageLimit,
  onSetLimit,
  onMessageClick,
  isLoading = false,
  isOnline,
}: InboxSectionProps) {
  const { isRTL } = useLanguage();
  const [tempLimit, setTempLimit] = useState(messageLimit);
  const [isLimitDialogOpen, setIsLimitDialogOpen] = useState(false);

  const config = categoryConfig[category];
  const Icon = config.icon;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return isRTL ? `${diffMins} د` : `${diffMins}m`;
    if (diffHours < 24) return isRTL ? `${diffHours} س` : `${diffHours}h`;
    return isRTL ? `${diffDays} ي` : `${diffDays}d`;
  };

  const handleSaveLimit = () => {
    onSetLimit(tempLimit);
    setIsLimitDialogOpen(false);
  };

  const unreadCount = messages.filter(m => !m.is_read).length;

  return (
    <div className={cn(
      'rounded-2xl border p-4 transition-all duration-200 bg-card border-border',
      unreadCount > 0 && 'border-primary/25'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-base">
                {config.label[isRTL ? 'ar' : 'en']}
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{messages.length}/{messageLimit}</p>
          </div>
        </div>

        <Dialog open={isLimitDialogOpen} onOpenChange={setIsLimitDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg touch-feedback">
              <Settings2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">{isRTL ? 'إعدادات الصندوق' : 'Inbox Settings'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="text-center p-4 bg-muted rounded-xl">
                <span className="text-4xl font-bold">{tempLimit}</span>
                <p className="text-sm text-muted-foreground mt-1">{isRTL ? 'الحد الأقصى' : 'maximum'}</p>
              </div>
              <Slider value={[tempLimit]} onValueChange={([value]) => setTempLimit(value)} min={10} max={500} step={10} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{isRTL ? 'تركيز' : 'Focus'}</span>
                <span>{isRTL ? 'أكثر' : 'More'}</span>
              </div>
              <Button onClick={handleSaveLimit} className="w-full h-11 rounded-xl">{isRTL ? 'حفظ' : 'Save'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Messages */}
      <div className="space-y-1.5 max-h-80 overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="h-6 w-6 mx-auto animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">{isRTL ? 'لا توجد رسائل' : 'No messages'}</p>
          </div>
        ) : (
          messages.slice(0, 5).map((message) => {
            const senderName = message.sender_profile?.display_name || message.sender_profile?.username || (isRTL ? 'مجهول' : 'Unknown');
            const senderOnline = category === 'direct' && isOnline && message.sender_profile?.id
              ? isOnline(message.sender_profile.id) : false;

            return (
              <button
                key={message.id}
                onClick={() => onMessageClick(message)}
                className={cn(
                  'w-full text-start p-3 rounded-xl transition-all touch-feedback',
                  message.is_read ? 'bg-muted/30' : 'bg-primary/5 border border-primary/15',
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn('p-1.5 rounded-lg relative', message.is_read ? 'bg-muted' : 'bg-primary/10')}>
                    {message.is_read ? <MailOpen className="h-4 w-4 text-muted-foreground" /> : <Mail className="h-4 w-4 text-primary" />}
                    {/* Gold online indicator */}
                    {senderOnline && (
                      <div className="absolute -top-0.5 -end-0.5 w-3 h-3 rounded-full border-2 border-card" style={{ background: 'var(--gradient-gold)' }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={cn('font-medium text-sm truncate', !message.is_read && 'text-foreground')}>
                        {senderName}
                      </span>
                      {senderOnline && (
                        <span className="text-[10px] text-primary font-medium">{isRTL ? 'نشط' : 'Active'}</span>
                      )}
                      <span className="text-xs text-muted-foreground ms-auto">{formatTime(message.created_at)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {message.voice_url ? (isRTL ? '🎤 رسالة صوتية' : '🎤 Voice message') : message.content}
                    </p>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {messages.length > 5 && (
        <Button variant="ghost" size="sm" className="w-full mt-2 text-xs">
          {isRTL ? `الكل (${messages.length})` : `All (${messages.length})`}
        </Button>
      )}
    </div>
  );
}
