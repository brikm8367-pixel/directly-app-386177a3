import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/i18n/LanguageContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Send, User, Loader2, ArrowLeft, Share2, Copy } from 'lucide-react';
import { toast } from 'sonner';
import MessageComposer from '@/components/messaging/MessageComposer';

interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_public: boolean | null;
}

export default function PublicProfile() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showComposer, setShowComposer] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) return;
      setIsLoading(true);
      const cleanUsername = username.replace(/^@/, '');
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, bio, is_public')
        .eq('username', cleanUsername)
        .single();

      if (error || !data) {
        setNotFound(true);
      } else {
        setProfile(data as Profile);
      }
      setIsLoading(false);
    };
    fetchProfile();
  }, [username]);

  const shareProfile = async () => {
    const url = `${window.location.origin}/@${profile?.username}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${profile?.display_name} — Directly`, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success(isRTL ? 'تم نسخ الرابط' : 'Link copied');
      }
    } catch { /* cancelled */ }
  };

  const copyLink = async () => {
    const url = `${window.location.origin}/@${profile?.username}`;
    await navigator.clipboard.writeText(url);
    toast.success(isRTL ? 'تم نسخ الرابط' : 'Link copied');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <User className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-2">{isRTL ? 'المستخدم غير موجود' : 'User not found'}</h1>
        <p className="text-muted-foreground mb-6">@{username?.replace(/^@/, '')}</p>
        <Button onClick={() => navigate('/')} variant="outline" className="rounded-xl">
          <ArrowLeft className="h-4 w-4 me-2" />
          {isRTL ? 'العودة' : 'Go back'}
        </Button>
      </div>
    );
  }

  if (profile && !profile.is_public && profile.id !== user?.id) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <User className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-bold mb-2">{isRTL ? 'هذا الملف خاص' : 'This profile is private'}</h1>
        <p className="text-muted-foreground mb-6">@{profile.username}</p>
        <Button onClick={() => navigate('/')} variant="outline" className="rounded-xl">
          <ArrowLeft className="h-4 w-4 me-2" />
          {isRTL ? 'العودة' : 'Go back'}
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Back */}
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mb-6 h-11 w-11 rounded-xl">
          <ArrowLeft className="h-5 w-5" />
        </Button>

        {/* Profile card */}
        <Card className="p-8 text-center border-primary/10">
          <Avatar className="h-24 w-24 mx-auto mb-4 ring-4 ring-primary/10">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-3xl">
              {profile?.display_name?.[0] || <User className="h-10 w-10" />}
            </AvatarFallback>
          </Avatar>

          <h1 className="text-2xl font-bold mb-1">{profile?.display_name}</h1>
          <p className="text-muted-foreground mb-4">@{profile?.username}</p>
          
          {profile?.bio && (
            <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">{profile.bio}</p>
          )}

          <div className="flex gap-3 justify-center">
            {user && user.id !== profile?.id && (
              <Button onClick={() => setShowComposer(true)} className="rounded-xl h-12 px-6 text-base">
                <Send className="h-5 w-5 me-2" />
                {isRTL ? 'إرسال رسالة' : 'Send Message'}
              </Button>
            )}
            {!user && (
              <Button onClick={() => navigate('/')} className="rounded-xl h-12 px-6 text-base">
                <Send className="h-5 w-5 me-2" />
                {isRTL ? 'سجل دخولك لإرسال رسالة' : 'Sign in to message'}
              </Button>
            )}
            <Button variant="outline" size="icon" onClick={shareProfile} className="h-12 w-12 rounded-xl">
              <Share2 className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon" onClick={copyLink} className="h-12 w-12 rounded-xl">
              <Copy className="h-5 w-5" />
            </Button>
          </div>
        </Card>

        {/* Directly branding */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          Directly — {isRTL ? 'تواصل ذكي' : 'Smart Communication'}
        </p>
      </div>

      {profile && (
        <MessageComposer
          isOpen={showComposer}
          onClose={() => setShowComposer(false)}
          recipient={profile}
          onMessageSent={() => { setShowComposer(false); toast.success(isRTL ? 'تم الإرسال ✨' : 'Sent ✨'); }}
        />
      )}
    </div>
  );
}
