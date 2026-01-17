import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Briefcase, Users, Heart, Crown, Settings2, Mail, MailOpen, AlertTriangle } from 'lucide-react';
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
    label: { ar: 'العمل', en: 'Work' },
    subtitle: { ar: 'رسائل مهنية', en: 'Professional' },
  },
  audience: {
    icon: Users,
    label: { ar: 'الجمهور', en: 'Audience' },
    subtitle: { ar: 'رسائل عامة', en: 'Public messages' },
  },
  direct: {
    icon: Heart,
    label: { ar: 'مباشر', en: 'Direct' },
    subtitle: { ar: 'المقربون فقط', en: 'Close contacts' },
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
  const isAlmostFull = messages.length >= messageLimit * 0.8;

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
      'rounded-3xl border-2 p-5 transition-all duration-300',
      'bg-card border-primary/10',
      isFull && 'border-destructive/30 bg-destructive/5',
      unreadCount > 0 && !isFull && 'ring-2 ring-primary/20 shadow-md'
    )}>
      {/* Header - Golden and clear */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className={cn(
            'p-4 rounded-2xl shadow-lg',
            isFull ? 'bg-destructive/20' : 'bg-primary/10'
          )}>
            <Icon className={cn('h-6 w-6', isFull ? 'text-destructive' : 'text-primary')} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-xl text-foreground">
                {config.label[isRTL ? 'ar' : 'en']}
              </h3>
              {unreadCount > 0 && (
                <span className="px-3 py-1 text-sm font-bold bg-primary text-primary-foreground rounded-full animate-gold-glow">
                  {unreadCount}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {messages.length} / {messageLimit} {config.subtitle[isRTL ? 'ar' : 'en']}
            </p>
          </div>
        </div>

        <Dialog open={isLimitDialogOpen} onOpenChange={setIsLimitDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl touch-feedback hover:bg-primary/10">
              <Settings2 className="h-6 w-6 text-primary" />
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl border-2 border-primary/20">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                <Crown className="h-7 w-7 text-primary" />
                {isRTL ? 'تحكم في صندوقك' : 'Control Your Inbox'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Psychological messaging */}
              <p className="text-base text-center text-muted-foreground">
                {isRTL 
                  ? '🎯 كلما قل العدد، زادت جودة وقتك' 
                  : '🎯 Less messages = Higher quality time'}
              </p>
              
              {/* Current value - big and clear */}
              <div className="text-center p-6 bg-primary/5 rounded-3xl border-2 border-primary/20">
                <span className="text-6xl font-bold text-primary">
                  {tempLimit}
                </span>
                <p className="text-lg text-muted-foreground mt-2">
                  {isRTL ? 'رسالة كحد أقصى' : 'messages maximum'}
                </p>
              </div>
              
              <Slider
                value={[tempLimit]}
                onValueChange={([value]) => setTempLimit(value)}
                min={10}
                max={500}
                step={10}
                className="w-full py-6"
              />
              
              <div className="flex justify-between text-base text-muted-foreground">
                <span>🧘 {isRTL ? 'تركيز عالي' : 'High focus'}</span>
                <span>📬 {isRTL ? 'استقبال أكثر' : 'More inbox'}</span>
              </div>
              
              <Button 
                onClick={handleSaveLimit} 
                size="lg" 
                className="w-full h-16 text-xl rounded-2xl touch-feedback glow-gold font-bold"
              >
                ✓ {isRTL ? 'حفظ' : 'Save'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Important messages hint - Gold themed */}
      {importantCount > 0 && (
        <div className="mb-4 p-4 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center gap-3">
          <Crown className="h-6 w-6 text-primary animate-crown" />
          <p className="text-base font-semibold text-foreground">
            {isRTL 
              ? `${importantCount} رسائل مهمة تنتظرك` 
              : `${importantCount} important messages`}
          </p>
        </div>
      )}

      {/* Full warning - Very visible */}
      {isFull && (
        <div className="mb-4 p-5 rounded-2xl bg-destructive/10 border-2 border-destructive/30 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-destructive/20">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <div className="flex-1">
            <p className="text-lg font-bold text-destructive">
              {isRTL ? 'صندوقك ممتلئ!' : 'Inbox is full!'}
            </p>
            <p className="text-sm text-destructive/80">
              {isRTL 
                ? 'لن تستقبل رسائل جديدة. اضغط ⚙️ لزيادة الحد' 
                : 'No new messages. Click ⚙️ to increase limit'}
            </p>
          </div>
        </div>
      )}

      {/* Almost full warning */}
      {isAlmostFull && !isFull && (
        <div className="mb-4 p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/20 flex items-center gap-3">
          <Mail className="h-5 w-5 text-amber-600" />
          <p className="text-sm font-medium text-amber-700">
            {isRTL 
              ? `الصندوق يمتلئ (${messages.length}/${messageLimit})` 
              : `Inbox filling up (${messages.length}/${messageLimit})`}
          </p>
        </div>
      )}

      {/* Messages list - Larger and clearer */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="relative inline-block">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
              <Crown className="h-4 w-4 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-base text-muted-foreground mt-3">
              {isRTL ? 'جاري التحميل...' : 'Loading...'}
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-14">
            <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Crown className="h-10 w-10 text-primary" />
            </div>
            <p className="text-xl font-bold text-foreground mb-2">
              {isRTL ? 'لا توجد رسائل' : 'No messages'}
            </p>
            <p className="text-base text-muted-foreground">
              {isRTL ? '🎯 وقتك محمي ومنظم' : '🎯 Your time is protected'}
            </p>
          </div>
        ) : (
          messages.slice(0, 5).map((message, index) => (
            <button
              key={message.id}
              onClick={() => onMessageClick(message)}
              className={cn(
                'w-full text-start p-5 rounded-2xl border-2 transition-all touch-feedback',
                'hover:shadow-lg active:shadow-md',
                message.is_read 
                  ? 'bg-card border-border' 
                  : 'bg-primary/5 border-primary/20 shadow-md',
                message.is_important && !message.is_read && 'border-s-4 border-s-primary',
                !message.is_read && 'animate-fade-in-up',
              )}
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="flex items-start gap-4">
                {message.is_read ? (
                  <div className="p-3 rounded-xl bg-muted">
                    <MailOpen className="h-5 w-5 text-muted-foreground" />
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={cn(
                      'font-bold text-lg truncate',
                      !message.is_read ? 'text-foreground' : 'text-muted-foreground'
                    )}>
                      {message.sender_profile?.display_name || 
                       message.sender_profile?.username || 
                       (isRTL ? 'مجهول' : 'Unknown')}
                    </span>
                    {message.is_important && (
                      <Crown className="h-4 w-4 text-primary flex-shrink-0" />
                    )}
                  </div>
                  {message.subject && (
                    <p className={cn(
                      'text-base truncate mb-1',
                      !message.is_read ? 'font-semibold text-foreground' : 'text-muted-foreground'
                    )}>
                      {message.subject}
                    </p>
                  )}
                  <p className="text-base text-muted-foreground truncate">
                    {message.content}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
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
          className="w-full mt-4 h-14 text-lg rounded-2xl touch-feedback border-2 border-primary/20 hover:bg-primary/5"
        >
          {isRTL 
            ? `عرض الكل (${messages.length})` 
            : `View all (${messages.length})`}
        </Button>
      )}
    </div>
  );
}