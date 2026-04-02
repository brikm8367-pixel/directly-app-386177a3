import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Send, Loader2, User, ArrowLeft, ArrowRight, Mic, Phone, Video, Image as ImageIcon, X, Check, CheckCheck, Copy, Reply, MoreVertical, Shield, Timer, Pencil } from 'lucide-react';
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
  is_edited?: boolean | null;
  edited_at?: string | null;
  expires_at?: string | null;
}

interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  reaction: string;
}

const REACTIONS = ['❤️', '👍', '🔥', '😂', '👎'];
const UNSEND_WINDOW_MS = 5 * 60 * 1000;
const EDIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const DISAPPEAR_OPTIONS = [
  { label: '10s', value: 10 * 1000 },
  { label: '1h', value: 60 * 60 * 1000 },
  { label: '24h', value: 24 * 60 * 60 * 1000 },
  { label: '7d', value: 7 * 24 * 60 * 60 * 1000 },
];

const haptic = (style: 'light' | 'medium' | 'heavy' = 'light') => {
  if ('vibrate' in navigator) {
    navigator.vibrate(style === 'light' ? 10 : style === 'medium' ? 20 : 40);
  }
};

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
  const [editingMsg, setEditingMsg] = useState<{ id: string; content: string } | null>(null);
  const [disappearTimer, setDisappearTimer] = useState<number | null>(null);
  const [showTimerMenu, setShowTimerMenu] = useState(false);
  const [showE2EBanner, setShowE2EBanner] = useState(false);
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

  const decryptThread = async (msgs: ThreadMessage[]): Promise<ThreadMessage[]> => {
    if (!user) return msgs;
    return Promise.all(
      msgs.map(async (msg) => {
        if (isEncryptedMessage(msg.content)) {
          const plaintext = await decryptFromSender(msg.content, msg.sender_id === user.id ? msg.receiver_id : msg.sender_id);
          return { ...msg, content: plaintext };
        }
        return msg;
      })
    );
  };

  // Show E2E banner on first open
  useEffect(() => {
    if (isOpen && message) {
      const key = `e2e_banner_${message.id}`;
      if (!sessionStorage.getItem(key)) {
        setShowE2EBanner(true);
        sessionStorage.setItem(key, '1');
        setTimeout(() => setShowE2EBanner(false), 3000);
      }
    }
  }, [isOpen, message?.id]);

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
      // Filter out expired messages
      const now = new Date();
      const filtered = ((data as ThreadMessage[]) || []).filter(m => 
        !deletedSet.has(m.id) && (!m.expires_at || new Date(m.expires_at) > now)
      );
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

  useEffect(() => {
    if (!isOpen || !message || !user) return;
    const rootId = getRootId(message);
    if (!rootId) return;

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

    const msgChannel = supabase
      .channel(`thread-${rootId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, async (payload) => {
        const msg = payload.new as any;
        if (msg && (msg.id === rootId || msg.parent_id === rootId)) {
          const { data } = await supabase.from('messages').select('*').or(`id.eq.${rootId},parent_id.eq.${rootId}`).order('created_at', { ascending: true });
          const now = new Date();
          const filtered = ((data as ThreadMessage[]) || []).filter(m => 
            !deletedIds.has(m.id) && (!m.expires_at || new Date(m.expires_at) > now)
          );
          const decrypted = await decryptThread(filtered);
          setThread(decrypted);
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

  // Edit message
  const handleEditMessage = async () => {
    if (!editingMsg || !editingMsg.content.trim()) return;
    const encryptedContent = await encryptForRecipient(editingMsg.content, otherUserId!);
    await supabase.from('messages').update({
      content: encryptedContent,
      is_edited: true,
      edited_at: new Date().toISOString(),
    } as any).eq('id', editingMsg.id);
    setEditingMsg(null);
    toast.success(isRTL ? 'تم التعديل' : 'Edited');
    haptic('light');
  };

  const handleSendReply = async (text: string, voiceUrl?: string) => {
    if (!message || (!text.trim() && !voiceUrl && !mediaPreview) || !user) return;

    // If editing
    if (editingMsg) {
      setEditingMsg({ ...editingMsg, content: text });
      await handleEditMessage();
      return;
    }

    setIsSending(true);
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
          toast.error(isRTL ? 'هذا الشخص في وضع التركيز الآن — حاول لاحقاً.' : "This person is in focus mode — try again later.");
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

      const contentToSend = text || (mediaType === 'video' ? '🎥' : mediaType === 'image' ? '📷' : '🎤');
      const encryptedContent = await encryptForRecipient(contentToSend, otherUserId!);

      // Disappearing messages
      const expiresAt = disappearTimer ? new Date(Date.now() + disappearTimer).toISOString() : null;

      const { error } = await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: otherUserId!,
        content: encryptedContent,
        voice_url: voiceUrl || null,
        media_url: mediaUrl,
        media_type: mediaType,
        category: finalCategory,
        parent_id: rootId,
        expires_at: expiresAt,
      } as any);
      if (error) throw error;

      const senderProfile = await supabase.from('profiles').select('display_name').eq('id', user.id).single();
      supabase.functions.invoke('send-push-notification', {
        body: { receiverId: otherUserId, senderName: senderProfile.data?.display_name || 'Someone', messageType: voiceUrl ? 'voice' : mediaType || 'text', content: text },
      }).catch(() => {});

      setReplyContent('');
      setShowVoice(false);
      haptic('medium');

      if (rootId) {
        const { data } = await supabase.from('messages').select('*').or(`id.eq.${rootId},parent_id.eq.${rootId}`).order('created_at', { ascending: true });
        const now = new Date();
        const filtered = ((data as ThreadMessage[]) || []).filter(m => 
          !deletedIds.has(m.id) && (!m.expires_at || new Date(m.expires_at) > now)
        );
        const decrypted = await decryptThread(filtered);
        setThread(decrypted);
      }
      setSendingMsgId(null);
      onMessageRead?.();
    } catch (error) {
      console.error('Reply error:', error);
      toast.error(isRTL ? 'شيء ما لم يعمل — رسائلك بأمان.' : 'Something went wrong — your messages are safe.');
      setThread(prev => prev.filter(m => m.id !== tempId));
      setSendingMsgId(null);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    // Support multiple files
    for (let i = 0; i < Math.min(files.length, 10); i++) {
      const file = files[i];
      if (file.size > 25 * 1024 * 1024) { toast.error(isRTL ? 'الحد الأقصى 25 ميغابايت' : 'Max 25MB'); continue; }
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) { toast.error(isRTL ? 'صور وفيديوهات فقط' : 'Images and videos only'); continue; }
      // For now just use the first valid file
      setMediaPreview({ file, url: URL.createObjectURL(file) });
      break;
    }
  };

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

  const handleTouchStart = (msgId: string, e: React.TouchEvent | React.MouseEvent) => {
    longPressTimer.current = setTimeout(() => {
      haptic('medium');
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setContextMenu({ msgId, x: rect.left, y: rect.top - 160 });
    }, 500);
  };
  const handleTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const copyMessage = (msgId: string) => {
    const msg = thread.find(m => m.id === msgId);
    if (msg?.content) {
      navigator.clipboard.writeText(msg.content);
      toast.success(isRTL ? 'تم النسخ' : 'Copied');
    }
    setContextMenu(null);
  };

  const startEditing = (msgId: string) => {
    const msg = thread.find(m => m.id === msgId);
    if (!msg || msg.sender_id !== user?.id) return;
    if ((Date.now() - new Date(msg.created_at).getTime()) > EDIT_WINDOW_MS) {
      toast.error(isRTL ? 'انتهت مهلة التعديل (15 دقيقة)' : 'Edit window expired (15 min)');
      return;
    }
    setEditingMsg({ id: msgId, content: msg.content });
    setReplyContent(msg.content);
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
  const categoryLabel = message.category === 'work' ? (isRTL ? 'العمل 💼' : 'Work 💼')
    : message.category === 'direct' ? (isRTL ? 'الخاص 🤍' : 'Private 🤍')
    : (isRTL ? 'العلاقات 👥' : 'Relationships 👥');

  const categoryBubbleClass = message.category === 'work'
    ? 'bg-[hsl(var(--work))] text-white'
    : message.category === 'direct'
    ? 'bg-primary text-primary-foreground'
    : 'bg-[hsl(var(--audience))] text-white';

  return (
    <>
    <Dialog open={isOpen} onOpenChange={() => { setContextMenu(null); setEditingMsg(null); onClose(); }}>
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
              <p className="font-bold text-base truncate">{otherName} — {categoryLabel}</p>
              {isTyping ? (
                <p className="text-xs text-primary font-medium animate-pulse">
                  {isRTL ? 'يكتب...' : 'typing...'}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Shield className="h-3 w-3 text-emerald-500 inline" />
                  <span className="text-emerald-600 dark:text-emerald-400">E2E</span>
                </p>
              )}
            </div>
          </button>
          {/* Disappearing messages timer */}
          <div className="relative">
            <Button variant="ghost" size="icon" onClick={() => setShowTimerMenu(!showTimerMenu)} className={cn("h-10 w-10 rounded-xl touch-feedback", disappearTimer && "text-primary")}>
              <Timer className="h-4 w-4" />
            </Button>
            <AnimatePresence>
              {showTimerMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute top-12 end-0 bg-card rounded-xl shadow-lg border border-border py-1 z-50 min-w-[120px]"
                >
                  <button onClick={() => { setDisappearTimer(null); setShowTimerMenu(false); }} className={cn("w-full px-3 py-2 text-sm text-start hover:bg-muted", !disappearTimer && "text-primary font-semibold")}>
                    {isRTL ? 'إيقاف' : 'Off'}
                  </button>
                  {DISAPPEAR_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => { setDisappearTimer(opt.value); setShowTimerMenu(false); toast.success(isRTL ? `الرسائل ستختفي بعد ${opt.label}` : `Messages will disappear after ${opt.label}`); }} className={cn("w-full px-3 py-2 text-sm text-start hover:bg-muted", disappearTimer === opt.value && "text-primary font-semibold")}>
                      {opt.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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

        {/* E2E Banner */}
        <AnimatePresence>
          {showE2EBanner && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mx-4 mt-2 flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
            >
              <Shield className="h-4 w-4 text-emerald-600 shrink-0" />
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                {isRTL ? 'رسائلك هنا مشفرة ومحمية — فقط أنتما تريانها.' : 'Your messages here are encrypted and protected — only you two can see them.'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Disappear timer indicator */}
        {disappearTimer && (
          <div className="mx-4 mt-2 flex items-center gap-2 p-2 rounded-lg bg-primary/5">
            <Timer className="h-3.5 w-3.5 text-primary" />
            <p className="text-xs text-primary">
              {isRTL ? `الرسائل تختفي بعد ${DISAPPEAR_OPTIONS.find(o => o.value === disappearTimer)?.label}` : `Messages disappear after ${DISAPPEAR_OPTIONS.find(o => o.value === disappearTimer)?.label}`}
            </p>
          </div>
        )}

        {/* 1-hour inactivity notice */}
        {isInactive && thread.length > 0 && (
          <div className="mx-4 mt-2 flex items-center gap-2 p-3 rounded-xl bg-primary/5">
            <p className="text-xs text-muted-foreground">
              {isRTL ? 'مضت ساعة — رسالتك التالية ستُخصم من الرصيد' : 'Over an hour passed — your next message will deduct a credit'}
            </p>
          </div>
        )}

        {/* Empty conversation */}
        {!isLoading && thread.length === 0 && (
          <div className="flex-1 flex items-center justify-center p-8">
            <p className="text-sm text-muted-foreground text-center">
              {isRTL ? 'ابدأ المحادثة — كل كلمة في مكانها الصحيح.' : 'Start the conversation — every word in its right place.'}
            </p>
          </div>
        )}

        {/* Messages thread */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-1" onClick={() => { setContextMenu(null); setShowReactions(null); setShowTimerMenu(false); }}>
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
              const canEdit = isMine && (Date.now() - new Date(msg.created_at).getTime()) < EDIT_WINDOW_MS;

              const readStatus = isMine ? (
                isSendingThis ? (
                  <span className="flex items-center gap-0.5 text-[10px] text-primary-foreground/40">
                    <Check className="h-3 w-3" />
                  </span>
                ) : msg.is_read ? (
                  <span className={cn(
                    'flex items-center gap-0.5 text-[10px]',
                    message.category === 'work' ? 'text-blue-400'
                    : message.category === 'direct' ? 'text-amber-400'
                    : 'text-violet-400'
                  )}>
                    <CheckCheck className="h-3 w-3" />
                  </span>
                ) : (
                  <span className="flex items-center gap-0.5 text-[10px] text-primary-foreground/40">
                    <CheckCheck className="h-3 w-3" />
                  </span>
                )
              ) : null;

              return (
                <div key={msg.id}>
                  {showDateSep && (
                    <div className="text-center my-4">
                      <span className="text-[11px] text-muted-foreground bg-muted/70 px-4 py-1 rounded-full font-medium">
                        {dateSeparator(msg.created_at, isRTL)}
                      </span>
                    </div>
                  )}
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
                      <div
                        className={cn(
                          'px-4 py-2.5 rounded-2xl text-sm leading-relaxed transition-colors duration-500',
                          isSendingThis
                            ? 'bg-muted text-muted-foreground'
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
                        <div className={cn('flex items-center gap-1 mt-1', isMine ? 'justify-end' : '')}>
                          <span className={cn('text-[10px]', isMine ? 'text-white/60' : 'text-muted-foreground')}>
                            {relativeTime(msg.created_at, isRTL)}
                          </span>
                          {msg.is_edited && (
                            <span className={cn('text-[9px]', isMine ? 'text-white/40' : 'text-muted-foreground/60')}>
                              {isRTL ? 'تم التعديل' : 'edited'}
                            </span>
                          )}
                          {msg.expires_at && (
                            <Timer className={cn('h-2.5 w-2.5', isMine ? 'text-white/40' : 'text-muted-foreground/60')} />
                          )}
                          {readStatus}
                        </div>
                      </div>

                      {msgReactions.length > 0 && (
                        <div className={cn('flex gap-0.5 mt-0.5', isMine ? 'justify-end' : 'justify-start')}>
                          {[...new Set(msgReactions.map(r => r.reaction))].map(emoji => {
                            const count = msgReactions.filter(r => r.reaction === emoji).length;
                            return (
                              <button key={emoji} onClick={() => toggleReaction(msg.id, emoji)} className="px-1.5 py-0.5 rounded-full bg-muted/80 text-xs flex items-center gap-0.5 hover:bg-muted transition-colors">
                                {emoji}{count > 1 && <span className="text-[10px] text-muted-foreground">{count}</span>}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      <AnimatePresence>
                        {showReactions === msg.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className={cn('absolute -top-10 flex gap-1 bg-card rounded-full shadow-lg border border-border px-2 py-1 z-50', isMine ? 'end-0' : 'start-0')}
                          >
                            {REACTIONS.map(emoji => (
                              <button key={emoji} onClick={(e) => { e.stopPropagation(); toggleReaction(msg.id, emoji); }} className="text-lg hover:scale-125 transition-transform p-0.5">
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
          {isTyping && (
            <div className="flex justify-start mb-1">
              <div className="px-4 py-2.5 rounded-2xl rounded-es-md bg-muted">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground font-medium">{otherName}</span>
                  <div className="flex gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Context menu */}
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
              {/* Edit option */}
              {thread.find(m => m.id === contextMenu.msgId)?.sender_id === user?.id && (
                <button onClick={() => startEditing(contextMenu.msgId)} className="w-full px-4 py-2.5 text-sm text-start hover:bg-muted flex items-center gap-3">
                  <Pencil className="h-4 w-4" />
                  {isRTL ? 'تعديل' : 'Edit'}
                </button>
              )}
              <div className="h-px bg-border mx-3 my-1" />
              <button onClick={() => {
                const msg = thread.find(m => m.id === contextMenu.msgId);
                if (msg) setDeleteTarget({ id: msg.id, isMine: msg.sender_id === user?.id, createdAt: msg.created_at });
                setContextMenu(null);
              }} className="w-full px-4 py-2.5 text-sm text-start hover:bg-muted flex items-center gap-3 text-destructive">
                <X className="h-4 w-4" />
                {isRTL ? 'حذف' : 'Delete'}
              </button>
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

        {/* Reply / Edit area */}
        <div className="shrink-0 border-t border-border p-3 bg-card/50 rounded-b-3xl">
          {editingMsg && (
            <div className="flex items-center gap-2 mb-2 px-2">
              <Pencil className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs text-primary font-medium">{isRTL ? 'تعديل الرسالة' : 'Editing message'}</span>
              <button onClick={() => { setEditingMsg(null); setReplyContent(''); }} className="ms-auto text-xs text-muted-foreground hover:text-destructive">
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple onChange={handleFileSelect} className="hidden" />
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
                onChange={(e) => { setReplyContent(e.target.value); if (editingMsg) setEditingMsg({ ...editingMsg, content: e.target.value }); broadcastTyping(); }}
                rows={1}
                className="resize-none text-base rounded-2xl border-2 focus:border-primary flex-1 min-h-[48px] max-h-32"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (editingMsg) {
                      handleEditMessage();
                    } else {
                      handleSendReply(replyContent);
                    }
                  }
                }}
              />
              <Button
                onClick={() => editingMsg ? handleEditMessage() : handleSendReply(replyContent)}
                disabled={(!replyContent.trim() && !mediaPreview) || isSending}
                size="icon"
                className="h-12 w-12 rounded-xl shrink-0 touch-feedback"
              >
                {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : editingMsg ? <Check className="h-5 w-5" /> : <Send className="h-5 w-5" />}
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
            {isRTL ? 'ستختفي هذه الرسالة — أنت متأكد؟' : 'This message will disappear — are you sure?'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          {deleteTarget?.isMine && deleteTarget?.createdAt && (Date.now() - new Date(deleteTarget.createdAt).getTime()) < UNSEND_WINDOW_MS && (
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
              onClick={async () => {
                if (!deleteTarget) return;
                await supabase.from('messages').delete().eq('id', deleteTarget.id);
                setThread(prev => prev.filter(m => m.id !== deleteTarget.id));
                setDeleteTarget(null);
                haptic('medium');
                toast.success(isRTL ? 'اختفت — كأنها لم تكن.' : 'Gone — as if it never existed.');
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
              toast.success(isRTL ? 'اختفت — كأنها لم تكن.' : 'Gone — as if it never existed.');
            }}
          >
            {isRTL ? 'حذف من عندي' : 'Delete for me'}
          </AlertDialogAction>
          <AlertDialogCancel className="rounded-xl">{isRTL ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <BlockReportDialog isOpen={showBlockReport} onClose={() => setShowBlockReport(false)} targetUserId={otherUserId || ''} targetName={otherName} />
    </>
  );
}
