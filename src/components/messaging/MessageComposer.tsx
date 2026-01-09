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
import { Send, Loader2, User, X } from 'lucide-react';
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
        body: {
          subject,
          content,
          senderProfile: null, // Will be fetched on the backend if needed
        },
      });

      const category = classificationData?.category || 'audience';

      // Check if recipient can receive in Direct category
      if (category === 'direct') {
        const { data: auth } = await supabase.auth.getUser();
        const { data: canSend } = await supabase.rpc('can_send_to_direct', {
          _sender_id: auth.user?.id,
          _receiver_id: recipient.id,
        });

        if (!canSend) {
          // Fallback to audience if not allowed in direct
          const { error } = await supabase.from('messages').insert({
            sender_id: (await supabase.auth.getUser()).data.user?.id,
            receiver_id: recipient.id,
            subject: subject || null,
            content,
            category: 'audience',
          });

          if (error) throw error;
        } else {
          const { error } = await supabase.from('messages').insert({
            sender_id: (await supabase.auth.getUser()).data.user?.id,
            receiver_id: recipient.id,
            subject: subject || null,
            content,
            category: 'direct',
          });

          if (error) throw error;
        }
      } else {
        // Check if recipient can receive more messages in this category
        const { data: canReceive } = await supabase.rpc('can_receive_message', {
          _user_id: recipient.id,
          _category: category,
        });

        if (!canReceive) {
          toast.error(
            isRTL 
              ? 'صندوق المستلم ممتلئ في هذه الفئة' 
              : 'Recipient inbox is full for this category'
          );
          setIsSending(false);
          return;
        }

        const { error } = await supabase.from('messages').insert({
          sender_id: (await supabase.auth.getUser()).data.user?.id,
          receiver_id: recipient.id,
          subject: subject || null,
          content,
          category,
        });

        if (error) throw error;
      }

      toast.success(isRTL ? 'تم إرسال الرسالة' : 'Message sent');
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>{isRTL ? 'رسالة جديدة' : 'New Message'}</span>
          </DialogTitle>
        </DialogHeader>

        {recipient && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Avatar className="h-10 w-10">
              <AvatarImage src={recipient.avatar_url || undefined} />
              <AvatarFallback>
                {recipient.display_name?.[0] || <User className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">
                {recipient.display_name || recipient.username}
              </p>
              {recipient.username && (
                <p className="text-xs text-muted-foreground">@{recipient.username}</p>
              )}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <Input
            placeholder={isRTL ? 'الموضوع (اختياري)' : 'Subject (optional)'}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />

          <Textarea
            placeholder={isRTL ? 'اكتب رسالتك...' : 'Write your message...'}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="resize-none"
          />

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button 
              onClick={handleSend} 
              disabled={!content.trim() || isSending}
              className="flex-1"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4 me-1" />
                  {isRTL ? 'إرسال' : 'Send'}
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            {isRTL 
              ? 'سيتم تصنيف رسالتك تلقائياً في الصندوق المناسب' 
              : 'Your message will be automatically categorized'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
