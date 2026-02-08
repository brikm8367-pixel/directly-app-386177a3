import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Send, Loader2, User, Mic } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import VoiceRecorder from './VoiceRecorder';

interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

interface MessageComposerProps {
  isOpen: boolean;
  onClose: () => void;
  recipient: Profile | null;
  onMessageSent?: () => void;
}

export default function MessageComposer({ isOpen, onClose, recipient, onMessageSent }: MessageComposerProps) {
  const { isRTL } = useLanguage();
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showVoice, setShowVoice] = useState(false);

  const sendMessage = async (text: string, voiceUrl?: string) => {
    if (!recipient || (!text.trim() && !voiceUrl)) return;
    setIsSending(true);

    try {
      const { data: auth } = await supabase.auth.getUser();
      const senderId = auth.user?.id;
      if (!senderId) throw new Error('Not authenticated');

      // AI classification — no subject, content-only
      const { data: classData } = await supabase.functions.invoke('classify-message', {
        body: { content: text || 'Voice message' },
      });
      let category = classData?.category || 'audience';

      // Check direct access
      if (category === 'direct') {
        const { data: canSend } = await supabase.rpc('can_send_to_direct', {
          _sender_id: senderId, _receiver_id: recipient.id,
        });
        if (!canSend) category = 'audience';
      }

      // Smart routing: find existing active conversation in same category
      const { data: roots } = await supabase
        .from('messages')
        .select('id, is_sealed, created_at')
        .is('parent_id', null)
        .eq('category', category)
        .or(`and(sender_id.eq.${senderId},receiver_id.eq.${recipient.id}),and(sender_id.eq.${recipient.id},receiver_id.eq.${senderId})`)
        .order('created_at', { ascending: false })
        .limit(1);

      let parentId: string | null = null;
      let isNewContext = true;

      if (roots && roots.length > 0 && !roots[0].is_sealed) {
        // Check last activity in this thread
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('created_at')
          .or(`id.eq.${roots[0].id},parent_id.eq.${roots[0].id}`)
          .order('created_at', { ascending: false })
          .limit(1);

        const lastTime = lastMsg?.[0]?.created_at;
        if (lastTime) {
          const hoursSince = (Date.now() - new Date(lastTime).getTime()) / 3600000;
          if (hoursSince < 1) {
            parentId = roots[0].id;
            isNewContext = false;
          }
        }
      }

      // Check receiver limits only for new contexts
      if (isNewContext) {
        const { data: canReceive } = await supabase.rpc('can_receive_message', {
          _user_id: recipient.id, _category: category,
        });
        if (!canReceive) {
          toast.error(isRTL ? 'صندوق المستلم ممتلئ' : "Recipient's inbox is full");
          setIsSending(false);
          return;
        }
      }

      const { error } = await supabase.from('messages').insert({
        sender_id: senderId,
        receiver_id: recipient.id,
        content: text || '🎤',
        voice_url: voiceUrl || null,
        category,
        parent_id: parentId,
      } as any);
      if (error) throw error;

      toast.success(isRTL ? 'تم الإرسال ✨' : 'Sent ✨');
      setContent('');
      setShowVoice(false);
      onClose();
      onMessageSent?.();
    } catch (error) {
      console.error('Send error:', error);
      toast.error(isRTL ? 'فشل الإرسال' : 'Send failed');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-3xl p-0 gap-0">
        <DialogHeader className="p-5 pb-3 border-b border-border">
          <DialogTitle className="text-lg font-bold">
            {isRTL ? 'رسالة جديدة' : 'New Message'}
          </DialogTitle>
        </DialogHeader>

        <div className="p-5 space-y-4">
          {recipient && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/50">
              <Avatar className="h-12 w-12 ring-2 ring-primary/10">
                <AvatarImage src={recipient.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-lg">
                  {recipient.display_name?.[0] || <User className="h-5 w-5" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-base truncate">{recipient.display_name || recipient.username}</p>
                {recipient.username && <p className="text-sm text-muted-foreground">@{recipient.username}</p>}
              </div>
            </div>
          )}

          {showVoice ? (
            <VoiceRecorder
              onRecordComplete={(url) => sendMessage('🎤', url)}
              onCancel={() => setShowVoice(false)}
            />
          ) : (
            <>
              <Textarea
                placeholder={isRTL ? 'اكتب رسالتك...' : 'Write your message...'}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                className="resize-none text-base rounded-xl border-2 focus:border-primary p-4"
              />
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowVoice(true)}
                  className="h-13 w-13 rounded-xl touch-feedback"
                >
                  <Mic className="h-5 w-5" />
                </Button>
                <Button variant="outline" onClick={onClose} className="flex-1 h-13 text-base rounded-xl touch-feedback">
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  onClick={() => sendMessage(content)}
                  disabled={!content.trim() || isSending}
                  className="flex-1 h-13 text-base rounded-xl touch-feedback"
                >
                  {isSending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-5 w-5 me-2" />
                      {isRTL ? 'إرسال' : 'Send'}
                    </>
                  )}
                </Button>
              </div>
            </>
          )}

          <p className="text-xs text-muted-foreground text-center">
            {isRTL ? '✨ يتم تصنيف رسالتك تلقائياً بالذكاء الاصطناعي' : '✨ Auto-classified by AI'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
