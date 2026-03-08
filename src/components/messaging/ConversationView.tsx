import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Send, Loader2, User, ArrowLeft, ArrowRight, Mic, Phone, Video, Image as ImageIcon, X, Check, CheckCheck, Copy, Forward, Reply, MoreVertical, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Message, MessageCategory } from './InboxSection';
import VoiceRecorder from './VoiceRecorder';
import VoicePlayer from './VoicePlayer';
import CallScreen from './CallScreen';
import BlockReportDialog from './BlockReportDialog';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { encryptForRecipient, decryptFromSender, isEncryptedMessage } from '@/utils/e2eManager';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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

interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  reaction: string;
}

const REACTIONS = ['❤️', '👍', '🔥', '😂', '👎'];
const UNSEND_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

// Haptic feedback helper
const haptic = (style: 'light' | 'medium' | 'heavy' = 'light') => {
  if ('vibrate' in navigator) {
    navigator.vibrate(style === 'light' ? 10 : style === 'medium' ? 20 : 40);
  }
};

// Relative time formatter
function relativeTime(dateStr: string, isRTL: boolean): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return isRTL ? 'الآن' : 'Now';
  if (mins < 60) return isRTL ? `منذ ${mins} د` : `${mins}m ago`;
  if (hours < 24) return isRTL ? `منذ ${hours} س` : `${hours}h ago`;
  if (days === 1) return isRTL ? 'أمس' : 'Yesterday';
  if (days < 7) {
    const dayNames = isRTL
      ? ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return dayNames[new Date(dateStr).getDay()];
  }
  return new Intl.DateTimeFormat(isRTL ? 'ar' : 'en', { dateStyle: 'medium' }).format(new Date(dateStr));
}

// Date separator label
function dateSeparator(dateStr: string, isRTL: boolean): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return isRTL ? 'اليوم' : 'Today';
  if (diffDays === 1) return isRTL ? 'أمس' : 'Yesterday';
  return new Intl.DateTimeFormat(isRTL ? 'ar' : 'en', { dateStyle: 'medium' }).format(d);
}

export default function ConversationView({ message, isOpen, onClose, onMessageRead, canCall }: ConversationViewProps) {
  const { isRTL } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [replyContent, setReplyContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendingMsgId, setSendingMsgId] = useState<string | null>(null);
  const [thread, setThread] = useState<ThreadMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; isMine: boolean; createdAt: string } | null>(null);
  const [showVoice, setShowVoice] = useState(false);
  const [activeCall, setActiveCall] = useState<{ type: 'audio' | 'video' } | null>(null);
  const [mediaPreview, setMediaPreview] = useState<{ file: File; url: string } | null>(null);
  const [showBlockReport, setShowBlockReport] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ msgId: string; x: number; y: number } | null>(null);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [showReactions, setShowReactions] = useState<string | null>(null);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getRootId = (msg: Message | null): string | null => {
    if (!msg) return null;
    return msg.parent_id || msg.id;
  };

  const isInactiveThread = useCallback((threadMsgs: ThreadMessage[]) => {
    if (threadMsgs.length === 0) return true;
    const lastMsg = threadMsgs[threadMsgs.length - 1];
    return (Date.now() - new Date(lastMsg.created_at).getTime()) / 3600000 >= 1;
  }, []);

  // Decrypt thread messages
  const decryptThread = async (msgs: ThreadMessage[]): Promise<ThreadMessage[]> => {
    if (!user) return msgs;
    const decrypted = await Promise.all(
      msgs.map(async (msg) => {
        if (isEncryptedMessage(msg.content)) {
          const senderId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
          const plaintext = await decryptFromSender(msg.content, msg.sender_id === user.id ? msg.receiver_id : msg.sender_id);
          return { ...msg, content: plaintext };
        }
        return msg;
      })
    );
    return decrypted;
  };

  // Load thread + reactions + deleted_messages
  useEffect(() => {
    const loadThread = async () => {
      if (!message || !user) return;
      setIsLoading(true);
      const rootId = getRootId(message);
      if (!rootId) return;

      const [{ data }, { data: rxns }, { data: delMsgs }] = await Promise.all([
        supabase.from('messages').select('*').or(`id.eq.${rootId},parent_id.eq.${rootId}`).order('created_at', { ascending: true }),
        supabase.from('message_reactions').select('*'),
        supabase.from('deleted_messages').select('message_id').eq('user_id', user.id),
      ]);

      const deletedSet = new Set((delMsgs || []).map(d => d.message_id));
      setDeletedIds(deletedSet);
      const filtered = ((data as ThreadMessage[]) || []).filter(m => !deletedSet.has(m.id));
      
      // Decrypt messages
      const decrypted = await decryptThread(filtered);
      setThread(decrypted);
      setReactions((rxns as Reaction[]) || []);
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

  // Realtime: listen for new messages in this thread + typing indicator
  useEffect(() => {
    if (!isOpen || !message || !user) return;
    const rootId = getRootId(message);
    if (!rootId) return;

    // Typing indicator channel
    const typingChannel = supabase.channel(`typing-${rootId}`);
    typingChannel
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.userId !== user.id) {
          setIsTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
        }
      })
      .subscribe();

    // Realtime message updates (new messages + read status changes)
    const msgChannel = supabase
      .channel(`thread-${rootId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
      }, async (payload) => {
        const msg = payload.new as any;
        if (msg && (msg.id === rootId || msg.parent_id === rootId)) {
          // Reload thread
          const { data } = await supabase.from('messages').select('*').or(`id.eq.${rootId},parent_id.eq.${rootId}`).order('created_at', { ascending: true });
          const filtered = ((data as ThreadMessage[]) || []).filter(m => !deletedIds.has(m.id));
          const decrypted = await decryptThread(filtered);
          setThread(decrypted);

          // Mark unread as read
          if (data) {
            const unreadIds = data.filter(m => m.receiver_id === user.id && !m.is_read).map(m => m.id);
            if (unreadIds.length > 0) {
              await supabase.from('messages').update({ is_read: true }).in('id', unreadIds);
              onMessageRead?.();
            }
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(typingChannel);
      supabase.removeChannel(msgChannel);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      setIsTyping(false);
    };
  }, [isOpen, message?.id, user?.id]);

  // Broadcast typing event
  const broadcastTyping = useCallback(() => {
    if (!message || !user) return;
    const rootId = getRootId(message);
    if (!rootId) return;
    const channel = supabase.channel(`typing-${rootId}`);
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.send({ type: 'broadcast', event: 'typing', payload: { userId: user.id } });
      }
    });
  }, [message?.id, user?.id]);

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

    // Optimistic: create a temporary "sending" message
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: ThreadMessage = {
      id: tempId,
      sender_id: user.id,
      receiver_id: otherUserId!,
      content: text || (voiceUrl ? '🎤' : '📷'),
      created_at: new Date().toISOString(),
      is_read: null,
      category: message.category,
      parent_id: getRootId(message),
      voice_url: voiceUrl || null,
      media_url: mediaPreview?.url || null,
      media_type: mediaPreview?.file.type.startsWith('video/') ? 'video' : mediaPreview ? 'image' : null,
    };
    setSendingMsgId(tempId);
    setThread(prev => [...prev, optimisticMsg]);
    haptic('light');

    try {
      const rootId = getRootId(message);
      let mediaUrl: string | null = null;
      let mediaType: string | null = null;

      if (mediaPreview) {
        const result = await uploadMedia(mediaPreview.file);
        if (result) { mediaUrl = result.url; mediaType = result.type; }
        URL.revokeObjectURL(mediaPreview.url);
        setMediaPreview(null);
      }

      const shouldDeductCredit = isInactive;
      if (shouldDeductCredit) {
        const { data: canReceive } = await supabase.rpc('can_receive_message', {
          _user_id: otherUserId!, _category: message.category,
        });
        if (!canReceive) {
          toast.error(isRTL ? 'صندوق المستلم ممتلئ' : "Recipient's inbox is full");
          setThread(prev => prev.filter(m => m.id !== tempId));
          setIsSending(false);
          setSendingMsgId(null);
          return;
        }
      }

      let finalCategory = message.category;
      if (shouldDeductCredit && text.trim()) {
        try {
          const { data: classData } = await supabase.functions.invoke('classify-message', { body: { content: text } });
          if (classData?.category && classData.category !== 'direct' && message.category !== 'direct') {
            finalCategory = classData.category;
          }
        } catch { /* keep original */ }
      }

      // Encrypt the message content
      const contentToSend = text || (mediaType === 'video' ? '🎥' : mediaType === 'image' ? '📷' : '🎤');
      const encryptedContent = await encryptForRecipient(contentToSend, otherUserId!);

      const { error } = await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: otherUserId!,
        content: encryptedContent,
        voice_url: voiceUrl || null,
        media_url: mediaUrl,
        media_type: mediaType,
        category: finalCategory,
        parent_id: rootId,
      } as any);
      if (error) throw error;

      // Push notification
      const senderProfile = await supabase.from('profiles').select('display_name').eq('id', user.id).single();
      supabase.functions.invoke('send-push-notification', {
        body: { receiverId: otherUserId, senderName: senderProfile.data?.display_name || 'Someone', messageType: voiceUrl ? 'voice' : mediaType || 'text', content: text },
      }).catch(() => {});

      setReplyContent('');
      setShowVoice(false);
      haptic('medium');

      // Refresh thread with real data
      if (rootId) {
        const { data } = await supabase.from('messages').select('*').or(`id.eq.${rootId},parent_id.eq.${rootId}`).order('created_at', { ascending: true });
        const filtered = ((data as ThreadMessage[]) || []).filter(m => !deletedIds.has(m.id));
        const decrypted = await decryptThread(filtered);
        setThread(decrypted);
      }
      setSendingMsgId(null);
      onMessageRead?.();
    } catch (error) {
      console.error('Reply error:', error);
      toast.error(isRTL ? 'فشل الإرسال' : 'Send failed');
      setThread(prev => prev.filter(m => m.id !== tempId));
      setSendingMsgId(null);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) { toast.error(isRTL ? 'الحد الأقصى 25 ميغابايت' : 'Max 25MB'); return; }
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) { toast.error(isRTL ? 'صور وفيديوهات فقط' : 'Images and videos only'); return; }
    setMediaPreview({ file, url: URL.createObjectURL(file) });
  };

  // Reactions
  const toggleReaction = async (messageId: string, reaction: string) => {
    if (!user) return;
    const existing = reactions.find(r => r.message_id === messageId && r.user_id === user.id && r.reaction === reaction);
    if (existing) {
      await supabase.from('message_reactions').delete().eq('id', existing.id);
      setReactions(prev => prev.filter(r => r.id !== existing.id));
    } else {
      const { data } = await supabase.from('message_reactions').insert({ message_id: messageId, user_id: user.id, reaction } as any).select().single();
      if (data) setReactions(prev => [...prev, data as Reaction]);
    }
    haptic('light');
    setShowReactions(null);
  };

  // Swipe handler
  const handleSwipe = (msgId: string, info: PanInfo, isMine: boolean) => {
    if (Math.abs(info.offset.x) < 60) return;
    if ((!isRTL && info.offset.x > 60) || (isRTL && info.offset.x < -60)) {
      setReplyContent(`> ${thread.find(m => m.id === msgId)?.content?.substring(0, 50) || ''}\n`);
      haptic('light');
    } else if ((!isRTL && info.offset.x < -60) || (isRTL && info.offset.x > 60)) {
      const msg = thread.find(m => m.id === msgId);
      if (msg) setDeleteTarget({ id: msgId, isMine, createdAt: msg.created_at });
      haptic('medium');
    }
  };

  // Long press
  const handleTouchStart = (msgId: string, e: React.TouchEvent | React.MouseEvent) => {
    longPressTimer.current = setTimeout(() => {
      haptic('medium');
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setContextMenu({ msgId, x: rect.left, y: rect.top - 120 });
    }, 500);
  };
  const handleTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  // Copy message
  const copyMessage = (msgId: string) => {
    const msg = thread.find(m => m.id === msgId);
    if (msg?.content) {
      navigator.clipboard.writeText(msg.content);
      toast.success(isRTL ? 'تم النسخ' : 'Copied');
    }
    setContextMenu(null);
  };

  const fmtTime = (d: string) => new Intl.DateTimeFormat(isRTL ? 'ar' : 'en', { hour: '2-digit', minute: '2-digit' }).format(new Date(d));

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

  // Category color for message bubble
  const categoryBubbleClass = message.category === 'work'
    ? 'bg-[hsl(var(--work))] text-white'
    : message.category === 'direct'
    ? 'bg-primary text-primary-foreground'
    : 'bg-[hsl(var(--audience))] text-white';

  return (
    <>
    <Dialog open={isOpen} onOpenChange={() => { setContextMenu(null); onClose(); }}>
      <DialogContent className="max-w-lg max-h-[92vh] flex flex-col p-0 gap-0 rounded-3xl border-primary/10">
        {/* Header */}
        <div className="shrink-0 flex items-center gap-3 p-4 border-b border-border bg-card rounded-t-3xl">
          <Button variant="ghost" size="icon" onClick={onClose} className="h-11 w-11 rounded-xl touch-feedback">
            {isRTL ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
          </Button>
          <button
            onClick={() => { if (senderProfile?.username) { onClose(); navigate(`/@${senderProfile.username}`); } }}
            className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
          >
            <Avatar className="h-11 w-11 ring-2 ring-primary/10">
              <AvatarImage src={senderProfile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {otherName[0] || <User className="h-5 w-5" />}
              </AvatarFallback>
            </Avatar>
            <div className="text-start min-w-0">
              <p className="font-bold text-base truncate">{otherName}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {senderProfile?.username ? `@${senderProfile.username}` : ''}
                {' · '}
                <Shield className="h-3 w-3 text-emerald-500 inline" />
                <span className="text-emerald-600 dark:text-emerald-400">E2E</span>
              </p>
            </div>
          </button>
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
          <Button variant="ghost" size="icon" onClick={() => setShowBlockReport(true)} className="h-10 w-10 rounded-xl touch-feedback">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>

        {/* 1-hour inactivity notice */}
        {isInactive && thread.length > 0 && (
          <div className="mx-4 mt-3 flex items-center gap-2 p-3 rounded-xl bg-primary/5">
            <p className="text-xs text-muted-foreground">
              {isRTL ? 'مضت ساعة — رسالتك التالية ستُخصم من الرصيد' : 'Over an hour passed — your next message will deduct a credit'}
            </p>
          </div>
        )}

        {/* Messages thread */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-1" onClick={() => { setContextMenu(null); setShowReactions(null); }}>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            thread.map((msg, i) => {
              const isMine = msg.sender_id === user?.id;
              const showDateSep = i === 0 || dateSeparator(msg.created_at, isRTL) !== dateSeparator(thread[i - 1].created_at, isRTL);
              const isSendingThis = msg.id === sendingMsgId;
              const msgReactions = reactions.filter(r => r.message_id === msg.id);
              const canUnsend = isMine && (Date.now() - new Date(msg.created_at).getTime()) < UNSEND_WINDOW_MS;

              // Read status for my messages
              const readStatus = isMine ? (
                isSendingThis ? (
                  <Check className="h-3 w-3 text-primary-foreground/40" />
                ) : msg.is_read ? (
                  <CheckCheck className="h-3 w-3 text-blue-400" />
                ) : (
                  <CheckCheck className="h-3 w-3 text-primary-foreground/40" />
                )
              ) : null;

              return (
                <div key={msg.id}>
                  {/* Date separator */}
                  {showDateSep && (
                    <div className="text-center my-4">
                      <span className="text-[11px] text-muted-foreground bg-muted/70 px-4 py-1 rounded-full font-medium">
                        {dateSeparator(msg.created_at, isRTL)}
                      </span>
                    </div>
                  )}
                  {/* Swipeable message */}
                  <motion.div
                    drag="x"
                    dragConstraints={{ left: -80, right: 80 }}
                    dragElastic={0.3}
                    onDragEnd={(_, info) => handleSwipe(msg.id, info, isMine)}
                    className={cn('flex mb-0.5', isMine ? 'justify-end' : 'justify-start')}
                    onTouchStart={(e) => handleTouchStart(msg.id, e)}
                    onTouchEnd={handleTouchEnd}
                    onMouseDown={(e) => handleTouchStart(msg.id, e)}
                    onMouseUp={handleTouchEnd}
                    onMouseLeave={handleTouchEnd}
                  >
                    <div className="relative max-w-[80%]">
                      {/* Message bubble */}
                      <div
                        className={cn(
                          'px-4 py-2.5 rounded-2xl text-sm leading-relaxed transition-colors duration-500',
                          isSendingThis
                            ? 'bg-muted text-muted-foreground' // Gray while sending
                            : isMine
                            ? `${categoryBubbleClass} rounded-ee-md`
                            : 'bg-muted rounded-es-md'
                        )}
                      >
                        {msg.media_url && msg.media_type === 'image' && (
                          <img src={msg.media_url} alt="" className="rounded-xl max-w-full mb-2 cursor-pointer" onClick={() => window.open(msg.media_url!, '_blank')} />
                        )}
                        {msg.media_url && msg.media_type === 'video' && (
                          <video src={msg.media_url} controls className="rounded-xl max-w-full mb-2" />
                        )}
                        {msg.voice_url ? (
                          <VoicePlayer url={msg.voice_url} isMine={isMine} />
                        ) : msg.content && !['📷', '🎥', '🎤'].includes(msg.content) ? (
                          <p className="whitespace-pre-wrap">{msg.content === '🔒' ? (
                            <span className="flex items-center gap-1 text-muted-foreground italic">
                              <Shield className="h-3 w-3" /> {isRTL ? 'رسالة مشفرة' : 'Encrypted message'}
                            </span>
                          ) : msg.content}</p>
                        ) : null}
                        {/* Time + read status */}
                        <div className={cn('flex items-center gap-1 mt-1', isMine ? 'justify-end' : '')}>
                          <span className={cn('text-[10px]', isMine ? 'text-white/60' : 'text-muted-foreground')}>
                            {relativeTime(msg.created_at, isRTL)}
                          </span>
                          {readStatus}
                        </div>
                      </div>

                      {/* Reactions display */}
                      {msgReactions.length > 0 && (
                        <div className={cn('flex gap-0.5 mt-0.5', isMine ? 'justify-end' : 'justify-start')}>
                          {[...new Set(msgReactions.map(r => r.reaction))].map(emoji => {
                            const count = msgReactions.filter(r => r.reaction === emoji).length;
                            return (
                              <button
                                key={emoji}
                                onClick={() => toggleReaction(msg.id, emoji)}
                                className="px-1.5 py-0.5 rounded-full bg-muted/80 text-xs flex items-center gap-0.5 hover:bg-muted transition-colors"
                              >
                                {emoji}{count > 1 && <span className="text-[10px] text-muted-foreground">{count}</span>}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Quick reaction picker */}
                      <AnimatePresence>
                        {showReactions === msg.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className={cn('absolute -top-10 flex gap-1 bg-card rounded-full shadow-lg border border-border px-2 py-1 z-50', isMine ? 'end-0' : 'start-0')}
                          >
                            {REACTIONS.map(emoji => (
                              <button
                                key={emoji}
                                onClick={(e) => { e.stopPropagation(); toggleReaction(msg.id, emoji); }}
                                className="text-lg hover:scale-125 transition-transform p-0.5"
                              >
                                {emoji}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                </div>
              );
            })
          )}
        </div>

        {/* Context menu (long press) */}
        <AnimatePresence>
          {contextMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed z-[100] bg-card rounded-2xl shadow-xl border border-border py-2 min-w-[180px]"
              style={{ left: Math.min(contextMenu.x, window.innerWidth - 200), top: Math.max(contextMenu.y, 60) }}
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => { setShowReactions(contextMenu.msgId); setContextMenu(null); }} className="w-full px-4 py-2.5 text-sm text-start hover:bg-muted flex items-center gap-3">
                <span className="text-base">❤️</span>
                {isRTL ? 'تفاعل' : 'React'}
              </button>
              <button onClick={() => { setReplyContent(`> ${thread.find(m => m.id === contextMenu.msgId)?.content?.substring(0, 50) || ''}\n`); setContextMenu(null); }} className="w-full px-4 py-2.5 text-sm text-start hover:bg-muted flex items-center gap-3">
                <Reply className="h-4 w-4" />
                {isRTL ? 'رد' : 'Reply'}
              </button>
              <button onClick={() => copyMessage(contextMenu.msgId)} className="w-full px-4 py-2.5 text-sm text-start hover:bg-muted flex items-center gap-3">
                <Copy className="h-4 w-4" />
                {isRTL ? 'نسخ' : 'Copy'}
              </button>
              <div className="h-px bg-border mx-3 my-1" />
              <button onClick={() => {
                const msg = thread.find(m => m.id === contextMenu.msgId);
                if (msg) setDeleteTarget({ id: msg.id, isMine: msg.sender_id === user?.id, createdAt: msg.created_at });
                setContextMenu(null);
              }} className="w-full px-4 py-2.5 text-sm text-start hover:bg-muted flex items-center gap-3 text-destructive">
                <X className="h-4 w-4" />
                {isRTL ? 'حذف' : 'Delete'}
              </button>
              {/* Exact timestamp */}
              <div className="px-4 py-1.5 text-[10px] text-muted-foreground border-t border-border mt-1">
                {new Intl.DateTimeFormat(isRTL ? 'ar' : 'en', { dateStyle: 'full', timeStyle: 'short' }).format(new Date(thread.find(m => m.id === contextMenu.msgId)?.created_at || ''))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
            <VoiceRecorder onRecordComplete={(url) => handleSendReply('🎤', url)} onCancel={() => setShowVoice(false)} />
          ) : (
            <div className="flex items-end gap-2">
              <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="h-12 w-12 rounded-xl shrink-0 touch-feedback">
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setShowVoice(true)} className="h-12 w-12 rounded-xl shrink-0 touch-feedback">
                <Mic className="h-5 w-5 text-muted-foreground" />
              </Button>
              <Textarea
                placeholder={isRTL ? 'اكتب رسالة...' : 'Write a message...'}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={1}
                className="resize-none text-base rounded-2xl border-2 focus:border-primary flex-1 min-h-[48px] max-h-32"
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(replyContent); } }}
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

    {/* Delete confirmation */}
    <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>{isRTL ? 'حذف الرسالة' : 'Delete message'}</AlertDialogTitle>
          <AlertDialogDescription>
            {isRTL ? 'كيف تريد حذف هذه الرسالة؟' : 'How do you want to delete this message?'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          {/* Unsend for everyone — only if mine and within 5 minutes */}
          {deleteTarget?.isMine && deleteTarget?.createdAt && (Date.now() - new Date(deleteTarget.createdAt).getTime()) < UNSEND_WINDOW_MS && (
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
              onClick={async () => {
                if (!deleteTarget) return;
                await supabase.from('messages').delete().eq('id', deleteTarget.id);
                setThread(prev => prev.filter(m => m.id !== deleteTarget.id));
                setDeleteTarget(null);
                haptic('medium');
                toast.success(isRTL ? 'تم الحذف للجميع' : 'Deleted for everyone');
                onMessageRead?.();
              }}
            >
              {isRTL ? 'حذف للجميع' : 'Delete for everyone'}
            </AlertDialogAction>
          )}
          <AlertDialogAction
            className="bg-muted text-foreground hover:bg-muted/80 rounded-xl"
            onClick={async () => {
              if (!deleteTarget || !user) return;
              await supabase.from('deleted_messages').insert({ message_id: deleteTarget.id, user_id: user.id } as any);
              setThread(prev => prev.filter(m => m.id !== deleteTarget.id));
              setDeletedIds(prev => new Set([...prev, deleteTarget.id]));
              setDeleteTarget(null);
              haptic('light');
              toast.success(isRTL ? 'تم الحذف' : 'Deleted');
            }}
          >
            {isRTL ? 'حذف من عندي' : 'Delete for me'}
          </AlertDialogAction>
          <AlertDialogCancel className="rounded-xl">{isRTL ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {/* Block/Report Dialog */}
    <BlockReportDialog isOpen={showBlockReport} onClose={() => setShowBlockReport(false)} targetUserId={otherUserId || ''} targetName={otherName} />
    </>
  );
}
