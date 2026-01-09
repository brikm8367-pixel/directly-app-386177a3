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

interface Message {
  id: string;
  sender_id: string;
  sender_profile?: {
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

  return (
    <div className={cn(
      'rounded-xl border p-4 transition-all duration-200',
      config.bgClass,
      config.borderClass
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn('p-2 rounded-lg', config.colorClass)}>
            <Icon className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              {categoryLabels[category][isRTL ? 'ar' : 'en']}
            </h3>
            <p className="text-xs text-muted-foreground">
              {messages.length} / {messageLimit}
            </p>
          </div>
        </div>

        <Dialog open={isLimitDialogOpen} onOpenChange={setIsLimitDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings2 className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isRTL ? 'تحديد عدد الرسائل' : 'Set Message Limit'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="text-center">
                <span className={cn('text-4xl font-bold', config.textClass)}>
                  {tempLimit}
                </span>
                <p className="text-sm text-muted-foreground mt-1">
                  {isRTL ? 'رسالة كحد أقصى' : 'messages max'}
                </p>
              </div>
              <Slider
                value={[tempLimit]}
                onValueChange={([value]) => setTempLimit(value)}
                min={10}
                max={500}
                step={10}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>10</span>
                <span>500</span>
              </div>
              <Button onClick={handleSaveLimit} className="w-full">
                {isRTL ? 'حفظ' : 'Save'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Full warning */}
      {isFull && (
        <div className="mb-3 p-2 rounded-lg bg-destructive/10 border border-destructive/20">
          <p className="text-xs text-destructive text-center">
            {isRTL 
              ? 'صندوقك ممتلئ. لزيادة العدد، اضغط على ⚙️' 
              : 'Inbox full. Increase limit by clicking ⚙️'}
          </p>
        </div>
      )}

      {/* Messages list */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-4">
            <div className="h-4 w-4 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-6">
            <Mail className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {isRTL ? 'لا توجد رسائل' : 'No messages'}
            </p>
          </div>
        ) : (
          messages.slice(0, 5).map((message) => (
            <button
              key={message.id}
              onClick={() => onMessageClick(message)}
              className={cn(
                'w-full text-start p-3 rounded-lg border transition-all hover:shadow-sm',
                message.is_read 
                  ? 'bg-card border-border' 
                  : 'bg-card border-primary/20 shadow-sm'
              )}
            >
              <div className="flex items-start gap-2">
                {message.is_read ? (
                  <MailOpen className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                ) : (
                  <Mail className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={cn(
                      'font-medium text-sm truncate',
                      !message.is_read && 'text-foreground'
                    )}>
                      {message.sender_profile?.display_name || 
                       message.sender_profile?.username || 
                       (isRTL ? 'مجهول' : 'Unknown')}
                    </span>
                    {message.is_important && (
                      <Zap className="h-3 w-3 text-amber-500 shrink-0" />
                    )}
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatTime(message.created_at)}
                    </span>
                  </div>
                  {message.subject && (
                    <p className="text-xs font-medium text-foreground truncate mb-0.5">
                      {message.subject}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground truncate">
                    {message.content}
                  </p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {messages.length > 5 && (
        <Button variant="ghost" size="sm" className="w-full mt-2 text-xs">
          {isRTL 
            ? `عرض الكل (${messages.length})` 
            : `View all (${messages.length})`}
        </Button>
      )}
    </div>
  );
}
