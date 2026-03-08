import { Button } from '@/components/ui/button';
import { Send, Share2, Copy, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  isLoggedIn: boolean;
  isOwnProfile: boolean;
  personalityType?: string;
  labels: Record<string, string>;
  onSendMessage: () => void;
  onShare: () => void;
  onCopyUsername: () => void;
}

export default function ProfileActions({ isLoggedIn, isOwnProfile, personalityType, labels, onSendMessage, onShare, onCopyUsername }: Props) {
  const navigate = useNavigate();

  return (
    <div className="flex gap-3 justify-center flex-wrap">
      {isLoggedIn && !isOwnProfile && (
        <Button onClick={onSendMessage} className="rounded-xl h-12 px-6 text-base">
          <Send className="h-5 w-5 me-2" />
          {personalityType
            ? `${labels.talkTo} "${personalityType.split(' ')[0]}"`
            : labels.sendMessage}
        </Button>
      )}
      {!isLoggedIn && (
        <Button onClick={() => navigate('/')} className="rounded-xl h-12 px-6 text-base">
          <MessageCircle className="h-5 w-5 me-2" />
          {labels.joinDirectly}
        </Button>
      )}
      <Button variant="outline" onClick={onShare} className="rounded-xl h-12 px-5 text-sm">
        <Share2 className="h-4 w-4 me-2" />
        {labels.shareProfile}
      </Button>
      <Button variant="outline" size="icon" onClick={onCopyUsername} className="h-12 w-12 rounded-xl">
        <Copy className="h-5 w-5" />
      </Button>
    </div>
  );
}
