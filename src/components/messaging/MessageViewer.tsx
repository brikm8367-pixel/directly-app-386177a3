import { useState, useEffect } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Send, Loader2, User, Zap, ArrowLeft, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { MessageCategory } from './InboxSection';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
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
  category: MessageCategory;
  parent_id: string | null;
}

interface MessageViewerProps {
  message: Message | null;
  isOpen: boolean;
  onClose: () => void;
  onMessageRead?: () => void;
}

export default function MessageViewer({
  message,
  isOpen,
  onClose,
  onMessageRead,
}: MessageViewerProps) {
  const { isRTL } = useLanguage();
  const [replyContent, setReplyContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [thread, setThread] = useState<Message[]>([]);

  // Mark as read when opened
  useEffect(() => {
    const markAsRead = async () => {
      if (message && !message.is_read) {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('id', message.id);
        onMessageRead?.();
      }
    };

    if (isOpen && message) {
      markAsRead();
      // Load thread
      loadThread();
    }
  }, [isOpen, message?.id]);

  const loadThread = async () => {
    if (!message) return;
    
    // For now, just show the current message
    // In future, load parent messages for a full thread
    setThread([message]);
  };

  const handleReply = async () => {
    if (!message || !replyContent.trim()) return;

    setIsSending(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      
      const { error } = await supabase.from('messages').insert({
        sender_id: user.user?.id,
        receiver_id: message.sender_id,
        subject: message.subject ? `Re: ${message.subject}` : null,
        content: replyContent,
        category: message.category,
        parent_id: message.id,
      });

      if (error) throw error;

      toast.success(isRTL ? 'تم إرسال الرد' : 'Reply sent');
      setReplyContent('');
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error(isRTL ? 'فشل إرسال الرد' : 'Failed to send reply');
    } finally {
      setIsSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(isRTL ? 'ar' : 'en', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  const categoryLabels = {
    work: { ar: 'العمل', en: 'Work' },
    audience: { ar: 'الجمهور', en: 'Audience' },
    direct: { ar: 'مباشر', en: 'Direct' },
  };

  const categoryColors = {
    work: 'bg-[hsl(var(--work))]',
    audience: 'bg-[hsl(var(--audience))]',
    direct: 'bg-[hsl(var(--others))]',
  };

  if (!message) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              {isRTL ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
            </Button>
            <DialogTitle className="flex-1 truncate">
              {message.subject || (isRTL ? 'رسالة' : 'Message')}
            </DialogTitle>
            <span className={cn(
              'text-xs px-2 py-0.5 rounded-full text-white',
              categoryColors[message.category]
            )}>
              {categoryLabels[message.category][isRTL ? 'ar' : 'en']}
            </span>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Sender info */}
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={message.sender_profile?.avatar_url || undefined} />
              <AvatarFallback>
                {message.sender_profile?.display_name?.[0] || <User className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm">
                  {message.sender_profile?.display_name || message.sender_profile?.username}
                </p>
                {message.is_important && (
                  <Zap className="h-4 w-4 text-amber-500" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDate(message.created_at)}
              </p>
            </div>
          </div>

          {/* Message content */}
          <div className="p-4 rounded-lg bg-muted/30 border border-border">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          </div>
        </div>

        {/* Reply section */}
        <div className="shrink-0 border-t border-border pt-4 space-y-3">
          <Textarea
            placeholder={isRTL ? 'اكتب ردك...' : 'Write your reply...'}
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            rows={2}
            className="resize-none"
          />
          <Button 
            onClick={handleReply}
            disabled={!replyContent.trim() || isSending}
            className="w-full"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4 me-1" />
                {isRTL ? 'رد' : 'Reply'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
