import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Send, Loader2, User, ArrowLeft, ArrowRight, Lock, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Message, MessageCategory } from './InboxSection';

interface ConversationViewProps {
  message: Message | null;
  isOpen: boolean;
  onClose: () => void;
  onMessageRead?: () => void;
}

interface ConversationMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  subject: string | null;
  created_at: string;
  is_read: boolean | null;
  is_sealed: boolean;
  category: MessageCategory;
  parent_id: string | null;
}

export default function ConversationView({
  message,
  isOpen,
  onClose,
  onMessageRead,
}: ConversationViewProps) {
  const { isRTL } = useLanguage();
  const { user } = useAuth();
  const [replyContent, setReplyContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSealing, setIsSealing] = useState(false);
  const [thread, setThread] = useState<ConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Find the root message ID for a conversation
  const getRootId = (msg: Message | null): string | null => {
    if (!msg) return null;
    return msg.parent_id || msg.id;
  };

  // Load full conversation thread
  useEffect(() => {
    const loadThread = async () => {
      if (!message || !user) return;
      setIsLoading(true);

      const rootId = getRootId(message);
      if (!rootId) return;

      // Get root message + all replies
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`id.eq.${rootId},parent_id.eq.${rootId}`)
        .order('created_at', { ascending: true });

      setThread((data as ConversationMessage[]) || []);
      setIsLoading(false);

      // Mark unread messages as read
      if (data) {
        const unreadIds = data
          .filter(m => m.receiver_id === user.id && !m.is_read)
          .map(m => m.id);
        if (unreadIds.length > 0) {
          await supabase
            .from('messages')
            .update({ is_read: true })
            .in('id', unreadIds);
          onMessageRead?.();
        }
      }
    };

    if (isOpen && message) loadThread();
  }, [isOpen, message?.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thread]);

  const isConversationSealed = thread.some(m => m.is_sealed);
  const otherUserId = message?.sender_id === user?.id ? message?.receiver_id : message?.sender_id;
  const isReceiver = message?.receiver_id === user?.id;

  const handleReply = async () => {
    if (!message || !replyContent.trim() || !user) return;

    setIsSending(true);
    try {
      const rootId = getRootId(message);

      if (isConversationSealed) {
        // Sealed conversation - new message is a new context
        const { error } = await supabase.from('messages').insert({
          sender_id: user.id,
          receiver_id: otherUserId!,
          subject: message.subject ? `Re: ${message.subject}` : null,
          content: replyContent,
          category: message.category,
          // No parent_id - it's a new conversation context
        });
        if (error) throw error;
        toast.success(isRTL ? 'تم إرسال رسالة جديدة (سياق جديد)' : 'New message sent (new context)');
      } else {
        // Reply within same conversation - unlimited, no counter deduction
        const { error } = await supabase.from('messages').insert({
          sender_id: user.id,
          receiver_id: otherUserId!,
          subject: message.subject ? `Re: ${message.subject}` : null,
          content: replyContent,
          category: message.category,
          parent_id: rootId,
        });
        if (error) throw error;
        toast.success(isRTL ? 'تم إرسال الرد' : 'Reply sent');
      }

      setReplyContent('');
      // Reload thread
      const rootId2 = getRootId(message);
      if (rootId2) {
        const { data } = await supabase
          .from('messages')
          .select('*')
          .or(`id.eq.${rootId2},parent_id.eq.${rootId2}`)
          .order('created_at', { ascending: true });
        setThread((data as ConversationMessage[]) || []);
      }
      onMessageRead?.();
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error(isRTL ? 'فشل إرسال الرد' : 'Failed to send reply');
    } finally {
      setIsSending(false);
    }
  };

  const handleSeal = async () => {
    if (!message || !user) return;
    setIsSealing(true);
    try {
      const rootId = getRootId(message);
      // Mark the root message as sealed
      await supabase
        .from('messages')
        .update({ is_sealed: true })
        .eq('id', rootId!);

      setThread(prev => prev.map(m => m.id === rootId ? { ...m, is_sealed: true } : m));
      toast.success(isRTL ? 'تم ختم المحادثة' : 'Conversation sealed');
    } catch (error) {
      toast.error(isRTL ? 'فشل ختم المحادثة' : 'Failed to seal conversation');
    } finally {
      setIsSealing(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Intl.DateTimeFormat(isRTL ? 'ar' : 'en', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat(isRTL ? 'ar' : 'en', {
      dateStyle: 'medium',
    }).format(new Date(dateString));
  };

  if (!message) return null;

  const senderProfile = message.sender_profile;
  const otherName = senderProfile?.display_name || senderProfile?.username || (isRTL ? 'مجهول' : 'Unknown');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[92vh] flex flex-col p-0 gap-0 rounded-3xl border-primary/10">
        {/* Header */}
        <div className="shrink-0 flex items-center gap-3 p-4 border-b border-border bg-card rounded-t-3xl">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-11 w-11 rounded-xl touch-feedback"
          >
            {isRTL ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
          </Button>
          <Avatar className="h-11 w-11 ring-2 ring-primary/10">
            <AvatarImage src={senderProfile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {otherName[0] || <User className="h-5 w-5" />}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base truncate">{otherName}</p>
            <p className="text-xs text-muted-foreground">
              {message.subject || (isRTL ? 'محادثة' : 'Conversation')}
            </p>
          </div>
          {/* Seal button - only for receiver */}
          {isReceiver && !isConversationSealed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSeal}
              disabled={isSealing}
              className="h-11 w-11 rounded-xl touch-feedback text-muted-foreground hover:text-destructive"
              title={isRTL ? 'ختم المحادثة' : 'Seal conversation'}
            >
              <Lock className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Sealed notice */}
        {isConversationSealed && (
          <div className="mx-4 mt-3 flex items-center gap-2 p-3 rounded-xl bg-muted/50 border border-border">
            <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
            <p className="text-xs text-muted-foreground">
              {isRTL
                ? 'هذه محادثة منتهية، رسالتك التالية ستُعامل كسياق جديد'
                : 'This conversation is sealed. Your next message will start a new context'}
            </p>
          </div>
        )}

        {/* Messages - Messenger style */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            thread.map((msg, i) => {
              const isMine = msg.sender_id === user?.id;
              const showDate = i === 0 || formatDate(msg.created_at) !== formatDate(thread[i - 1].created_at);

              return (
                <div key={msg.id}>
                  {showDate && (
                    <div className="text-center my-3">
                      <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                        {formatDate(msg.created_at)}
                      </span>
                    </div>
                  )}
                  <div className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
                    <div
                      className={cn(
                        'max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed',
                        isMine
                          ? 'bg-primary text-primary-foreground rounded-ee-md'
                          : 'bg-muted rounded-es-md'
                      )}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <p className={cn(
                        'text-[10px] mt-1',
                        isMine ? 'text-primary-foreground/60' : 'text-muted-foreground'
                      )}>
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Reply input */}
        <div className="shrink-0 border-t border-border p-3 bg-card/50 rounded-b-3xl">
          <div className="flex items-end gap-2">
            <Textarea
              placeholder={
                isConversationSealed
                  ? (isRTL ? 'رسالة جديدة (سياق جديد)...' : 'New message (new context)...')
                  : (isRTL ? 'اكتب ردك...' : 'Write your reply...')
              }
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              rows={1}
              className="resize-none text-base rounded-2xl border-2 focus:border-primary flex-1 min-h-[48px] max-h-32"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleReply();
                }
              }}
            />
            <Button
              onClick={handleReply}
              disabled={!replyContent.trim() || isSending}
              size="icon"
              className="h-12 w-12 rounded-xl shrink-0 touch-feedback"
            >
              {isSending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
