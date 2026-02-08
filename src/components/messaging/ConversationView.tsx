import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Send, Loader2, User, ArrowLeft, ArrowRight, Lock, Mic, Phone, Video } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Message, MessageCategory } from './InboxSection';
import VoiceRecorder from './VoiceRecorder';
import VoicePlayer from './VoicePlayer';
import CallScreen from './CallScreen';

interface ConversationViewProps {
  message: Message | null;
  isOpen: boolean;
  onClose: () => void;
  onMessageRead?: () => void;
  canCall?: boolean;
}

interface ThreadMessage {
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
  voice_url?: string | null;
}

export default function ConversationView({ message, isOpen, onClose, onMessageRead, canCall }: ConversationViewProps) {
  const { isRTL } = useLanguage();
  const { user } = useAuth();
  const [replyContent, setReplyContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSealing, setIsSealing] = useState(false);
  const [thread, setThread] = useState<ThreadMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showVoice, setShowVoice] = useState(false);
  const [activeCall, setActiveCall] = useState<{ type: 'audio' | 'video' } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const getRootId = (msg: Message | null): string | null => {
    if (!msg) return null;
    return msg.parent_id || msg.id;
  };

  // Check if conversation is inactive (1 hour since last message)
  const isInactiveThread = useCallback((threadMsgs: ThreadMessage[]) => {
    if (threadMsgs.length === 0) return true;
    const lastMsg = threadMsgs[threadMsgs.length - 1];
    return (Date.now() - new Date(lastMsg.created_at).getTime()) / 3600000 >= 1;
  }, []);

  useEffect(() => {
    const loadThread = async () => {
      if (!message || !user) return;
      setIsLoading(true);

      const rootId = getRootId(message);
      if (!rootId) return;

      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`id.eq.${rootId},parent_id.eq.${rootId}`)
        .order('created_at', { ascending: true });

      setThread((data as ThreadMessage[]) || []);
      setIsLoading(false);

      if (data) {
        const unreadIds = data.filter(m => m.receiver_id === user.id && !m.is_read).map(m => m.id);
        if (unreadIds.length > 0) {
          await supabase.from('messages').update({ is_read: true }).in('id', unreadIds);
          onMessageRead?.();
        }
      }
    };

    if (isOpen && message) loadThread();
  }, [isOpen, message?.id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [thread]);

  const isConversationSealed = thread.some(m => m.is_sealed);
  const otherUserId = message?.sender_id === user?.id ? message?.receiver_id : message?.sender_id;
  const isReceiver = message?.receiver_id === user?.id;
  const isInactive = isInactiveThread(thread);

  const handleSendReply = async (text: string, voiceUrl?: string) => {
    if (!message || (!text.trim() && !voiceUrl) || !user) return;

    setIsSending(true);
    try {
      const rootId = getRootId(message);
      const shouldBeNewContext = isConversationSealed || isInactive;

      if (shouldBeNewContext) {
        // New context — deducts from counter
        const { data: canReceive } = await supabase.rpc('can_receive_message', {
          _user_id: otherUserId!, _category: message.category,
        });
        if (!canReceive) {
          toast.error(isRTL ? 'صندوق المستلم ممتلئ' : "Recipient's inbox is full");
          setIsSending(false);
          return;
        }

        const { error } = await supabase.from('messages').insert({
          sender_id: user.id,
          receiver_id: otherUserId!,
          content: text || '🎤',
          voice_url: voiceUrl || null,
          category: message.category,
        } as any);
        if (error) throw error;
        toast.success(isRTL ? 'تم إرسال رسالة جديدة' : 'New message sent');
      } else {
        // Reply within conversation — unlimited
        const { error } = await supabase.from('messages').insert({
          sender_id: user.id,
          receiver_id: otherUserId!,
          content: text || '🎤',
          voice_url: voiceUrl || null,
          category: message.category,
          parent_id: rootId,
        } as any);
        if (error) throw error;
        toast.success(isRTL ? 'تم إرسال الرد' : 'Reply sent');
      }

      setReplyContent('');
      setShowVoice(false);

      // Reload thread
      if (rootId) {
        const { data } = await supabase
          .from('messages')
          .select('*')
          .or(`id.eq.${rootId},parent_id.eq.${rootId}`)
          .order('created_at', { ascending: true });
        setThread((data as ThreadMessage[]) || []);
      }
      onMessageRead?.();
    } catch (error) {
      console.error('Reply error:', error);
      toast.error(isRTL ? 'فشل الإرسال' : 'Send failed');
    } finally {
      setIsSending(false);
    }
  };

  const handleSeal = async () => {
    if (!message || !user) return;
    setIsSealing(true);
    try {
      const rootId = getRootId(message);
      await supabase.from('messages').update({ is_sealed: true }).eq('id', rootId!);
      setThread(prev => prev.map(m => m.id === rootId ? { ...m, is_sealed: true } : m));
      toast.success(isRTL ? 'تم ختم المحادثة' : 'Conversation sealed');
    } catch {
      toast.error(isRTL ? 'فشل الختم' : 'Failed to seal');
    } finally {
      setIsSealing(false);
    }
  };

  const fmtTime = (d: string) => new Intl.DateTimeFormat(isRTL ? 'ar' : 'en', { hour: '2-digit', minute: '2-digit' }).format(new Date(d));
  const fmtDate = (d: string) => new Intl.DateTimeFormat(isRTL ? 'ar' : 'en', { dateStyle: 'medium' }).format(new Date(d));

  if (!message) return null;
  if (activeCall) {
    return (
      <CallScreen
        recipientId={otherUserId!}
        recipientName={message.sender_profile?.display_name || message.sender_profile?.username || ''}
        recipientAvatar={message.sender_profile?.avatar_url || undefined}
        callType={activeCall.type}
        onEnd={() => setActiveCall(null)}
      />
    );
  }

  const senderProfile = message.sender_profile;
  const otherName = senderProfile?.display_name || senderProfile?.username || (isRTL ? 'مجهول' : 'Unknown');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[92vh] flex flex-col p-0 gap-0 rounded-3xl border-primary/10">
        {/* Header */}
        <div className="shrink-0 flex items-center gap-3 p-4 border-b border-border bg-card rounded-t-3xl">
          <Button variant="ghost" size="icon" onClick={onClose} className="h-11 w-11 rounded-xl touch-feedback">
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
              {message.category === 'direct' ? (isRTL ? 'الخاص' : 'Private') :
               message.category === 'work' ? (isRTL ? 'العمل' : 'Work') : (isRTL ? 'الدائرة' : 'Audience')}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {/* Call buttons — only for Private inbox with mutual access */}
            {canCall && message.category === 'direct' && (
              <>
                <Button variant="ghost" size="icon" onClick={() => setActiveCall({ type: 'audio' })} className="h-10 w-10 rounded-xl touch-feedback">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setActiveCall({ type: 'video' })} className="h-10 w-10 rounded-xl touch-feedback">
                  <Video className="h-4 w-4" />
                </Button>
              </>
            )}
            {isReceiver && !isConversationSealed && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSeal}
                disabled={isSealing}
                className="h-10 w-10 rounded-xl touch-feedback text-muted-foreground hover:text-destructive"
                title={isRTL ? 'ختم المحادثة' : 'Seal conversation'}
              >
                <Lock className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Sealed notice — gentle and quiet */}
        {isConversationSealed && (
          <div className="mx-4 mt-3 flex items-center gap-2 p-3 rounded-xl bg-muted/50">
            <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <p className="text-xs text-muted-foreground">
              {isRTL
                ? 'محادثة مختومة. رسالتك التالية ستُوجّه حسب نوعها.'
                : 'Sealed conversation. Your next message will be routed by type.'}
            </p>
          </div>
        )}

        {/* 1-hour inactivity notice */}
        {!isConversationSealed && isInactive && thread.length > 0 && (
          <div className="mx-4 mt-3 flex items-center gap-2 p-3 rounded-xl bg-primary/5">
            <p className="text-xs text-muted-foreground">
              {isRTL
                ? 'مضت ساعة. رسالتك التالية ستكون سياقاً جديداً.'
                : 'Over an hour passed. Your next message will be a new context.'}
            </p>
          </div>
        )}

        {/* Messages thread */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            thread.map((msg, i) => {
              const isMine = msg.sender_id === user?.id;
              const showDate = i === 0 || fmtDate(msg.created_at) !== fmtDate(thread[i - 1].created_at);

              return (
                <div key={msg.id}>
                  {showDate && (
                    <div className="text-center my-3">
                      <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                        {fmtDate(msg.created_at)}
                      </span>
                    </div>
                  )}
                  <div className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
                    <div className={cn(
                      'max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed',
                      isMine ? 'bg-primary text-primary-foreground rounded-ee-md' : 'bg-muted rounded-es-md'
                    )}>
                      {(msg as any).voice_url ? (
                        <VoicePlayer url={(msg as any).voice_url} isMine={isMine} />
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                      <p className={cn('text-[10px] mt-1', isMine ? 'text-primary-foreground/60' : 'text-muted-foreground')}>
                        {fmtTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Reply area */}
        <div className="shrink-0 border-t border-border p-3 bg-card/50 rounded-b-3xl">
          {showVoice ? (
            <VoiceRecorder
              onRecordComplete={(url) => handleSendReply('🎤', url)}
              onCancel={() => setShowVoice(false)}
            />
          ) : (
            <div className="flex items-end gap-2">
              <Button variant="ghost" size="icon" onClick={() => setShowVoice(true)} className="h-12 w-12 rounded-xl shrink-0 touch-feedback">
                <Mic className="h-5 w-5 text-muted-foreground" />
              </Button>
              <Textarea
                placeholder={
                  isConversationSealed || isInactive
                    ? (isRTL ? 'رسالة جديدة...' : 'New message...')
                    : (isRTL ? 'اكتب ردك...' : 'Reply...')
                }
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={1}
                className="resize-none text-base rounded-2xl border-2 focus:border-primary flex-1 min-h-[48px] max-h-32"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(replyContent); }
                }}
              />
              <Button
                onClick={() => handleSendReply(replyContent)}
                disabled={!replyContent.trim() || isSending}
                size="icon"
                className="h-12 w-12 rounded-xl shrink-0 touch-feedback"
              >
                {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
