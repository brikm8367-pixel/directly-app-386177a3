import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/i18n/LanguageContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Send, User, Loader2, ArrowLeft, Share2, Copy, Sparkles, MessageCircle, Lock, Clock, Zap, Brain } from 'lucide-react';
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

interface PersonalityData {
  type?: string;
  description?: string;
  traits?: string[];
  advice?: string;
  insight?: string;
}

const LABELS: Record<string, Record<string, string>> = {
  ar: {
    sendMessage: 'إرسال رسالة',
    talkTo: 'تحدث مع',
    signIn: 'سجل دخولك لإرسال رسالة',
    goBack: 'العودة',
    privateProfile: 'هذا الملف خاص',
    userNotFound: 'المستخدم غير موجود',
    commStyle: 'نمط التواصل',
    shareProfile: 'شارك الملف الشخصي',
    linkCopied: 'تم نسخ الرابط',
    usernameCopied: 'تم نسخ اسم المستخدم',
    bestWay: 'أفضل طريقة للتواصل',
    responsePattern: 'نمط الاستجابة',
  },
  en: {
    sendMessage: 'Send Message',
    talkTo: 'Talk to',
    signIn: 'Sign in to message',
    goBack: 'Go back',
    privateProfile: 'This profile is private',
    userNotFound: 'User not found',
    commStyle: 'Communication Style',
    shareProfile: 'Share Profile',
    linkCopied: 'Link copied',
    usernameCopied: 'Username copied',
    bestWay: 'Best way to reach',
    responsePattern: 'Response Pattern',
  },
  fr: {
    sendMessage: 'Envoyer un message',
    talkTo: 'Parler à',
    signIn: 'Connectez-vous pour écrire',
    goBack: 'Retour',
    privateProfile: 'Ce profil est privé',
    userNotFound: 'Utilisateur introuvable',
    commStyle: 'Style de communication',
    shareProfile: 'Partager le profil',
    linkCopied: 'Lien copié',
    usernameCopied: 'Nom copié',
    bestWay: 'Meilleure façon de contacter',
    responsePattern: 'Schéma de réponse',
  },
  es: {
    sendMessage: 'Enviar mensaje',
    talkTo: 'Hablar con',
    signIn: 'Inicia sesión para escribir',
    goBack: 'Volver',
    privateProfile: 'Este perfil es privado',
    userNotFound: 'Usuario no encontrado',
    commStyle: 'Estilo de comunicación',
    shareProfile: 'Compartir perfil',
    linkCopied: 'Enlace copiado',
    usernameCopied: 'Usuario copiado',
    bestWay: 'Mejor forma de contactar',
    responsePattern: 'Patrón de respuesta',
  },
};

export default function PublicProfile() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const { isRTL, language } = useLanguage();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [personality, setPersonality] = useState<PersonalityData | null>(null);

  const l = LABELS[language] || LABELS.en;

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
        setIsLoading(false);
        return;
      }

      setProfile(data as Profile);

      // Update OG meta tags dynamically
      document.title = `${data.display_name || cleanUsername} — Directly`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', `${data.display_name}'s communication profile on Directly`);

      // Load personality for public profiles (no auth required)
      if (data.is_public) {
        const { data: analysis } = await supabase
          .from('weekly_analysis')
          .select('analysis')
          .eq('user_id', data.id)
          .order('week_start', { ascending: false })
          .limit(1);

        if (analysis?.[0]?.analysis) {
          const a = analysis[0].analysis as any;
          setPersonality({
            type: a.type || a.personalityType || null,
            description: a.description || null,
            traits: a.traits || [],
            advice: a.advice || null,
            insight: a.insight || null,
          });
        }
      }
      setIsLoading(false);
    };
    fetchProfile();
  }, [username]);

  const shareProfile = async () => {
    const url = `${window.location.origin}/@${profile?.username}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${profile?.display_name} — Directly`,
          text: personality?.type
            ? `${profile?.display_name} is a "${personality.type}" communicator on Directly`
            : `Check out ${profile?.display_name} on Directly`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success(l.linkCopied);
      }
    } catch { /* cancelled */ }
  };

  const copyUsername = async () => {
    await navigator.clipboard.writeText(`@${profile?.username}`);
    toast.success(l.usernameCopied);
  };

  const firstName = profile?.display_name?.split(' ')[0] || '';

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <User className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-2">{l.userNotFound}</h1>
        <p className="text-muted-foreground mb-6">@{username?.replace(/^@/, '')}</p>
        <Button onClick={() => navigate('/')} variant="outline" className="rounded-xl">
          <ArrowLeft className="h-4 w-4 me-2" />
          {l.goBack}
        </Button>
      </div>
    );
  }

  if (profile && !profile.is_public && profile.id !== user?.id) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <Lock className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-bold mb-2">{l.privateProfile}</h1>
        <p className="text-muted-foreground mb-6">@{profile.username}</p>
        <Button onClick={() => navigate('/')} variant="outline" className="rounded-xl">
          <ArrowLeft className="h-4 w-4 me-2" />
          {l.goBack}
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-8">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mb-6 h-11 w-11 rounded-xl">
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <Card className="p-8 text-center border-primary/10">
          <Avatar className="h-24 w-24 mx-auto mb-4 ring-4 ring-primary/10">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-3xl">
              {profile?.display_name?.[0] || <User className="h-10 w-10" />}
            </AvatarFallback>
          </Avatar>

          <h1 className="text-2xl font-bold mb-1">{profile?.display_name}</h1>
          <button onClick={copyUsername} className="text-muted-foreground hover:text-primary transition-colors mb-3 inline-block">
            @{profile?.username}
          </button>

          {profile?.bio && (
            <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">{profile.bio}</p>
          )}

          {/* Full personality analysis — visible to everyone */}
          {personality?.type && (
            <div className="mb-6 space-y-3">
              {/* Main personality card */}
              <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">{l.commStyle}</span>
                </div>
                <p className="text-xl font-bold text-foreground mb-2">{personality.type}</p>
                {personality.description && (
                  <p className="text-sm text-muted-foreground mb-3">{personality.description}</p>
                )}
                {personality.traits && personality.traits.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {personality.traits.slice(0, 5).map((t, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/15">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Insight & advice cards */}
              {personality.advice && (
                <div className="p-4 rounded-2xl bg-accent/50 border border-accent text-start">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="h-4 w-4 text-primary" />
                    <span className="text-xs font-semibold text-primary">{l.bestWay} {firstName}</span>
                  </div>
                  <p className="text-sm text-foreground">{personality.advice}</p>
                </div>
              )}
              {personality.insight && (
                <div className="p-4 rounded-2xl bg-muted/50 border border-border text-start">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <span className="text-xs font-semibold text-primary">{l.responsePattern}</span>
                  </div>
                  <p className="text-sm text-foreground">{personality.insight}</p>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 justify-center flex-wrap">
            {user && user.id !== profile?.id && (
              <>
                <Button onClick={() => setShowComposer(true)} className="rounded-xl h-12 px-6 text-base">
                  <Send className="h-5 w-5 me-2" />
                  {l.sendMessage}
                </Button>
                {personality?.type && (
                  <Button variant="outline" onClick={() => setShowComposer(true)} className="rounded-xl h-12 px-5 text-sm">
                    <MessageCircle className="h-4 w-4 me-2" />
                    {`${l.talkTo} ${firstName}`}
                  </Button>
                )}
              </>
            )}
            {!user && (
              <Button onClick={() => navigate('/')} className="rounded-xl h-12 px-6 text-base">
                <Send className="h-5 w-5 me-2" />
                {l.signIn}
              </Button>
            )}
            <Button variant="outline" onClick={shareProfile} className="rounded-xl h-12 px-5 text-sm">
              <Share2 className="h-4 w-4 me-2" />
              {l.shareProfile}
            </Button>
            <Button variant="outline" size="icon" onClick={copyUsername} className="h-12 w-12 rounded-xl">
              <Copy className="h-5 w-5" />
            </Button>
          </div>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Directly — Smart Communication
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
