import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Briefcase, Users, Heart, Zap, Settings2, Mail, MailOpen } from 'lucide-react';
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
}

interface InboxSectionProps {
  category: MessageCategory;
  messages: Message[];
  messageLimit: number;
  onSetLimit: (limit: number) => void;
  onMessageClick: (message: Message) => void;
  isLoading?: boolean;
}

const categoryConfig = {
  work: {
    icon: Briefcase,
    colorClass: 'bg-[hsl(var(--work))]',
    bgClass: 'bg-[hsl(var(--work-light))]',
    borderClass: 'border-[hsl(var(--work)/0.3)]',
    textClass: 'text-[hsl(var(--work))]',
  },
  audience: {
    icon: Users,
    colorClass: 'bg-[hsl(var(--audience))]',
    bgClass: 'bg-[hsl(var(--audience-light))]',
    borderClass: 'border-[hsl(var(--audience)/0.3)]',
    textClass: 'text-[hsl(var(--audience))]',
  },
  direct: {
    icon: Heart,
    colorClass: 'bg-[hsl(var(--others))]',
    bgClass: 'bg-[hsl(var(--others-light))]',
    borderClass: 'border-[hsl(var(--others)/0.3)]',
    textClass: 'text-[hsl(var(--others))]',
  },
};

export default function InboxSection({
  category,
  messages,
  messageLimit,
  onSetLimit,
  onMessageClick,
  isLoading = false,
}: InboxSectionProps) {
  const { isRTL } = useLanguage();
  const [tempLimit, setTempLimit] = useState(messageLimit);
  const [isLimitDialogOpen, setIsLimitDialogOpen] = useState(false);

  const config = categoryConfig[category];
  const Icon = config.icon;
  const isFull = messages.length >= messageLimit;

  const categoryLabels = {
    work: { ar: 'العمل', en: 'Work' },
    audience: { ar: 'الجمهور', en: 'Audience' },
    direct: { ar: 'مباشر', en: 'Direct' },
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return isRTL ? `${diffMins} د` : `${diffMins}m`;
    } else if (diffHours < 24) {
      return isRTL ? `${diffHours} س` : `${diffHours}h`;
    } else {
      return isRTL ? `${diffDays} ي` : `${diffDays}d`;
    }
  };

  const handleSaveLimit = () => {
    onSetLimit(tempLimit);
    setIsLimitDialogOpen(false);
  };

  const unreadCount = messages.filter(m => !m.is_read).length;
  const importantCount = messages.filter(m => m.is_important).length;

  return (
    <div className={cn(
      'rounded-2xl border-2 p-5 transition-all duration-200',
      config.bgClass,
      config.borderClass,
      unreadCount > 0 && 'ring-2 ring-primary/20'
    )}>
      {/* Header - Larger and more informative */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn('p-3 rounded-xl shadow-md', config.colorClass)}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-foreground">
                {categoryLabels[category][isRTL ? 'ar' : 'en']}
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold bg-primary text-primary-foreground rounded-full animate-pulse">
                  {unreadCount}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {messages.length} / {messageLimit} {isRTL ? 'رسالة' : 'messages'}
            </p>
          </div>
        </div>

        <Dialog open={isLimitDialogOpen} onOpenChange={setIsLimitDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl touch-feedback">
              <Settings2 className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {isRTL ? '🎯 تحكم في وقتك' : '🎯 Control your time'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Psychological messaging */}
              <p className="text-sm text-muted-foreground text-center">
                {isRTL 
                  ? 'كلما قل العدد، زاد تركيزك وإنتاجيتك' 
                  : 'Less messages = more focus & productivity'}
              </p>
              <div className="text-center p-4 bg-muted rounded-2xl">
                <span className={cn('text-5xl font-bold', config.textClass)}>
                  {tempLimit}
                </span>
                <p className="text-base text-muted-foreground mt-2">
                  {isRTL ? 'رسالة كحد أقصى' : 'messages max'}
                </p>
              </div>
              <Slider
                value={[tempLimit]}
                onValueChange={([value]) => setTempLimit(value)}
                min={10}
                max={500}
                step={10}
                className="w-full py-4"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{isRTL ? '🧘 تركيز عالي' : '🧘 High focus'}</span>
                <span>{isRTL ? '📬 استقبال أكثر' : '📬 More inbox'}</span>
              </div>
              <Button onClick={handleSaveLimit} size="lg" className="w-full h-14 text-lg rounded-xl touch-feedback">
                {isRTL ? '✓ حفظ الإعداد' : '✓ Save Setting'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Important messages hint */}
      {importantCount > 0 && (
        <div className="mb-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-500" />
          <p className="text-sm font-medium text-amber-700">
            {isRTL 
              ? `${importantCount} رسائل مهمة تنتظرك` 
              : `${importantCount} important messages waiting`}
          </p>
        </div>
      )}

      {/* Full warning - More prominent */}
      {isFull && (
        <div className="mb-4 p-4 rounded-xl bg-destructive/10 border-2 border-destructive/20 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-destructive/20">
            <Mail className="h-5 w-5 text-destructive" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-destructive">
              {isRTL ? 'صندوقك ممتلئ!' : 'Inbox is full!'}
            </p>
            <p className="text-xs text-destructive/80">
              {isRTL ? 'اضغط ⚙️ لزيادة الحد' : 'Click ⚙️ to increase limit'}
            </p>
          </div>
        </div>
      )}

      {/* Messages list - Larger, more readable */}
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="h-8 w-8 mx-auto animate-spin rounded-full border-3 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground mt-2">
              {isRTL ? 'جاري التحميل...' : 'Loading...'}
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-3">
              <Mail className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-base font-medium text-foreground mb-1">
              {isRTL ? 'لا توجد رسائل' : 'No messages'}
            </p>
            <p className="text-sm text-muted-foreground">
              {isRTL ? '🎯 وقتك محمي' : '🎯 Your time is protected'}
            </p>
          </div>
        ) : (
          messages.slice(0, 5).map((message, index) => (
            <button
              key={message.id}
              onClick={() => onMessageClick(message)}
              className={cn(
                'w-full text-start p-4 rounded-xl border-2 transition-all touch-feedback',
                'hover:shadow-md active:shadow-sm',
                message.is_read 
                  ? 'bg-card border-border' 
                  : 'bg-card border-primary/30 shadow-md',
                message.is_important && 'border-s-4 border-s-amber-500',
                !message.is_read && 'animate-fade-in-up',
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start gap-3">
                {message.is_read ? (
                  <div className="p-2 rounded-lg bg-muted">
                    <MailOpen className="h-5 w-5 text-muted-foreground" />
                  </div>
                ) : (
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      'font-semibold text-base truncate',
                      !message.is_read ? 'text-foreground' : 'text-muted-foreground'
                    )}>
                      {message.sender_profile?.display_name || 
                       message.sender_profile?.username || 
                       (isRTL ? 'مجهول' : 'Unknown')}
                    </span>
                    {message.is_important && (
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10">
                        <Zap className="h-3.5 w-3.5 text-amber-500" />
                        <span className="text-xs font-medium text-amber-600">
                          {isRTL ? 'مهم' : 'Important'}
                        </span>
                      </div>
                    )}
                  </div>
                  {message.subject && (
                    <p className={cn(
                      'text-sm truncate mb-1',
                      !message.is_read ? 'font-medium text-foreground' : 'text-muted-foreground'
                    )}>
                      {message.subject}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground truncate">
                    {message.content}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatTime(message.created_at)}
                  </p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {messages.length > 5 && (
        <Button 
          variant="outline" 
          size="lg" 
          className="w-full mt-4 h-12 text-base rounded-xl touch-feedback border-2"
        >
          {isRTL 
            ? `📬 عرض كل الرسائل (${messages.length})` 
            : `📬 View all messages (${messages.length})`}
        </Button>
      )}
    </div>
  );
}
