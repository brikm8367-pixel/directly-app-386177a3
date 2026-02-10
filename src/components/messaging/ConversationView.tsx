import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Send, Loader2, User, ArrowLeft, ArrowRight, Mic, Phone, Video, Image as ImageIcon, X } from 'lucide-react';
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
  created_at: string;
  is_read: boolean | null;
  category: MessageCategory;
  parent_id: string | null;
  voice_url?: string | null;
  media_url?: string | null;
  media_type?: string | null;
}

export default function ConversationView({ message, isOpen, onClose, onMessageRead, canCall }: ConversationViewProps) {
  const { isRTL } = useLanguage();
  const { user } = useAuth();
  const [replyContent, setReplyContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [thread, setThread] = useState<ThreadMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showVoice, setShowVoice] = useState(false);
  const [activeCall, setActiveCall] = useState<{ type: 'audio' | 'video' } | null>(null);
  const [mediaPreview, setMediaPreview] = useState<{ file: File; url: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const getRootId = (msg: Message | null): string | null => {
    if (!msg) return null;
    return msg.parent_id || msg.id;
  };

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

  const otherUserId = message?.sender_id === user?.id ? message?.receiver_id : message?.sender_id;
  const isInactive = isInactiveThread(thread);

  const uploadMedia = async (file: File): Promise<{ url: string; type: string } | null> => {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    const ext = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('media-messages').upload(fileName, file);
    if (error) return null;
    const { data: urlData } = supabase.storage.from('media-messages').getPublicUrl(fileName);
    const type = file.type.startsWith('video/') ? 'video' : 'image';
    return { url: urlData.publicUrl, type };
  };

  const handleSendReply = async (text: string, voiceUrl?: string) => {
    if (!message || (!text.trim() && !voiceUrl && !mediaPreview) || !user) return;
    setIsSending(true);

    try {
      const rootId = getRootId(message);
      const shouldBeNewContext = isInactive;

      let mediaUrl: string | null = null;
      let mediaType: string | null = null;

      if (mediaPreview) {
        const result = await uploadMedia(mediaPreview.file);
        if (result) { mediaUrl = result.url; mediaType = result.type; }
        URL.revokeObjectURL(mediaPreview.url);
        setMediaPreview(null);
      }

      if (shouldBeNewContext) {
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
          content: text || (mediaType === 'video' ? '🎥' : mediaType === 'image' ? '📷' : '🎤'),
          voice_url: voiceUrl || null,
          media_url: mediaUrl,
          media_type: mediaType,
          category: message.category,
        } as any);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('messages').insert({
          sender_id: user.id,
          receiver_id: otherUserId!,
          content: text || (mediaType === 'video' ? '🎥' : mediaType === 'image' ? '📷' : '🎤'),
          voice_url: voiceUrl || null,
          media_url: mediaUrl,
          media_type: mediaType,
          category: message.category,
          parent_id: rootId,
        } as any);
        if (error) throw error;
      }

      // Trigger push notification
      const senderProfile = await supabase.from('profiles').select('display_name').eq('id', user.id).single();
      supabase.functions.invoke('send-push-notification', {
        body: {
          receiverId: otherUserId,
          senderName: senderProfile.data?.display_name || 'Someone',
          messageType: voiceUrl ? 'voice' : mediaType || 'text',
          content: text,
        },
      }).catch(() => {});

      setReplyContent('');
      setShowVoice(false);
      toast.success(isRTL ? 'تم الإرسال ✨' : 'Sent ✨');

      if (rootId) {
        const { data } = await supabase.from('messages').select('*')
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      toast.error(isRTL ? 'الحد الأقصى 25 ميغابايت' : 'Max 25MB');
      return;
    }
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast.error(isRTL ? 'صور وفيديوهات فقط' : 'Images and videos only');
      return;
    }
    setMediaPreview({ file, url: URL.createObjectURL(file) });
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
               message.category === 'work' ? (isRTL ? 'العمل' : 'Work') : (isRTL ? 'العلاقات' : 'Relationships')}
            </p>
          </div>
          {/* Call buttons — only for Private inbox with mutual access */}
          {canCall && message.category === 'direct' && (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => setActiveCall({ type: 'audio' })} className="h-10 w-10 rounded-xl touch-feedback">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setActiveCall({ type: 'video' })} className="h-10 w-10 rounded-xl touch-feedback">
                <Video className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* 1-hour inactivity notice */}
        {isInactive && thread.length > 0 && (
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
                      {/* Media content */}
                      {msg.media_url && msg.media_type === 'image' && (
                        <img src={msg.media_url} alt="" className="rounded-xl max-w-full mb-2 cursor-pointer" onClick={() => window.open(msg.media_url!, '_blank')} />
                      )}
                      {msg.media_url && msg.media_type === 'video' && (
                        <video src={msg.media_url} controls className="rounded-xl max-w-full mb-2" />
                      )}
                      {msg.voice_url ? (
                        <VoicePlayer url={msg.voice_url} isMine={isMine} />
                      ) : msg.content && msg.content !== '📷' && msg.content !== '🎥' && msg.content !== '🎤' ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : null}
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

        {/* Media preview */}
        {mediaPreview && (
          <div className="mx-3 mb-2 relative">
            {mediaPreview.file.type.startsWith('video/') ? (
              <video src={mediaPreview.url} className="h-24 rounded-xl" />
            ) : (
              <img src={mediaPreview.url} className="h-24 rounded-xl object-cover" />
            )}
            <Button size="icon" variant="destructive" className="absolute top-1 end-1 h-6 w-6 rounded-full" onClick={() => { URL.revokeObjectURL(mediaPreview.url); setMediaPreview(null); }}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Reply area */}
        <div className="shrink-0 border-t border-border p-3 bg-card/50 rounded-b-3xl">
          <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFileSelect} className="hidden" />
          {showVoice ? (
            <VoiceRecorder
              onRecordComplete={(url) => handleSendReply('🎤', url)}
              onCancel={() => setShowVoice(false)}
            />
          ) : (
            <div className="flex items-end gap-2">
              <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="h-12 w-12 rounded-xl shrink-0 touch-feedback">
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setShowVoice(true)} className="h-12 w-12 rounded-xl shrink-0 touch-feedback">
                <Mic className="h-5 w-5 text-muted-foreground" />
              </Button>
              <Textarea
                placeholder={
                  isInactive
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
                disabled={(!replyContent.trim() && !mediaPreview) || isSending}
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
