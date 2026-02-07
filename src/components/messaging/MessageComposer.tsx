import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Send, Loader2, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

export default function MessageComposer({
  isOpen,
  onClose,
  recipient,
  onMessageSent,
}: MessageComposerProps) {
  const { isRTL } = useLanguage();
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!recipient || !content.trim()) return;

    setIsSending(true);
    try {
      // Get AI classification
      const { data: classificationData } = await supabase.functions.invoke('classify-message', {
        body: { subject, content, senderProfile: null },
      });

      const category = classificationData?.category || 'audience';

      const { data: auth } = await supabase.auth.getUser();
      const senderId = auth.user?.id;

      if (category === 'direct') {
        const { data: canSend } = await supabase.rpc('can_send_to_direct', {
          _sender_id: senderId,
          _receiver_id: recipient.id,
        });

        if (!canSend) {
          // Fallback to audience
          const { error } = await supabase.from('messages').insert({
            sender_id: senderId,
            receiver_id: recipient.id,
            subject: subject || null,
            content,
            category: 'audience',
          });
          if (error) throw error;
        } else {
          const { error } = await supabase.from('messages').insert({
            sender_id: senderId,
            receiver_id: recipient.id,
            subject: subject || null,
            content,
            category: 'direct',
          });
          if (error) throw error;
        }
      } else {
        const { data: canReceive } = await supabase.rpc('can_receive_message', {
          _user_id: recipient.id,
          _category: category,
        });

        if (!canReceive) {
          toast.error(
            isRTL ? 'صندوق المستلم ممتلئ في هذه الفئة' : 'Recipient inbox is full for this category'
          );
          setIsSending(false);
          return;
        }

        const { error } = await supabase.from('messages').insert({
          sender_id: senderId,
          receiver_id: recipient.id,
          subject: subject || null,
          content,
          category,
        });
        if (error) throw error;
      }

      toast.success(isRTL ? 'تم إرسال الرسالة ✨' : 'Message sent ✨');
      setSubject('');
      setContent('');
      onClose();
      onMessageSent?.();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(isRTL ? 'فشل إرسال الرسالة' : 'Failed to send message');
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
                <p className="font-bold text-base truncate">
                  {recipient.display_name || recipient.username}
                </p>
                {recipient.username && (
                  <p className="text-sm text-muted-foreground">@{recipient.username}</p>
                )}
              </div>
            </div>
          )}

          <Input
            placeholder={isRTL ? 'الموضوع (اختياري)' : 'Subject (optional)'}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="h-13 text-base rounded-xl border-2 focus:border-primary"
          />

          <Textarea
            placeholder={isRTL ? 'اكتب رسالتك...' : 'Write your message...'}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="resize-none text-base rounded-xl border-2 focus:border-primary p-4"
          />

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1 h-13 text-base rounded-xl touch-feedback">
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              onClick={handleSend}
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

          <p className="text-xs text-muted-foreground text-center">
            {isRTL
              ? '✨ سيتم تصنيف رسالتك تلقائياً بالذكاء الاصطناعي'
              : '✨ Your message will be auto-classified by AI'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
