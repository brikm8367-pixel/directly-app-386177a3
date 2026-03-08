import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/i18n/LanguageContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { User, Loader2, ArrowLeft, Lock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import MessageComposer from '@/components/messaging/MessageComposer';
import PersonalityAnalysis, { PersonalityData } from '@/components/profile/PersonalityAnalysis';
import ProfileActions from '@/components/profile/ProfileActions';
import { shareProfile, copyUsername } from '@/utils/sharing';

interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_public: boolean | null;
}

const LABELS: Record<string, Record<string, string>> = {
  ar: {
    sendMessage: 'إرسال رسالة', talkTo: 'تحدث مع', goBack: 'العودة',
    privateProfile: 'هذا الملف خاص', userNotFound: 'لم يتم العثور على هذا المستخدم',
    commStyle: 'نمط التواصل', shareProfile: 'شارك الملف', linkCopied: 'تم نسخ الرابط!',
    usernameCopied: 'تم نسخ اسم المستخدم', bestWay: 'أفضل طريقة للتواصل مع',
    responsePattern: 'نمط الاستجابة', joinDirectly: 'انضم إلى Directly',
    discoverStyle: 'اكتشف نمط تواصلك',
  },
  en: {
    sendMessage: 'Send Message', talkTo: 'Talk to', goBack: 'Go back',
    privateProfile: 'This profile is private', userNotFound: 'User not found',
    commStyle: 'Communication Style', shareProfile: 'Share Profile', linkCopied: 'Link copied!',
    usernameCopied: 'Username copied', bestWay: 'Best way to reach',
    responsePattern: 'Response Pattern', joinDirectly: 'Join Directly',
    discoverStyle: 'Discover your communication style',
  },
  fr: {
    sendMessage: 'Envoyer un message', talkTo: 'Parler à', goBack: 'Retour',
    privateProfile: 'Ce profil est privé', userNotFound: 'Utilisateur introuvable',
    commStyle: 'Style de communication', shareProfile: 'Partager le profil', linkCopied: 'Lien copié!',
    usernameCopied: 'Nom copié', bestWay: 'Meilleure façon de contacter',
    responsePattern: 'Schéma de réponse', joinDirectly: 'Rejoindre Directly',
    discoverStyle: 'Découvrez votre style de communication',
  },
  es: {
    sendMessage: 'Enviar mensaje', talkTo: 'Hablar con', goBack: 'Volver',
    privateProfile: 'Este perfil es privado', userNotFound: 'Usuario no encontrado',
    commStyle: 'Estilo de comunicación', shareProfile: 'Compartir perfil', linkCopied: 'Enlace copiado!',
    usernameCopied: 'Usuario copiado', bestWay: 'Mejor forma de contactar',
    responsePattern: 'Patrón de respuesta', joinDirectly: 'Unirse a Directly',
    discoverStyle: 'Descubre tu estilo de comunicación',
  },
};

export default function PublicProfile() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const { language } = useLanguage();
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
      
      // Only handle @username routes
      if (!username.startsWith('@')) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }
      
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

      // Dynamic meta tags
      const displayName = data.display_name || cleanUsername;
      document.title = `${displayName} — Directly`;

      // Load personality for public profiles
      if (data.is_public) {
        const { data: analysis } = await supabase
          .from('weekly_analysis')
          .select('analysis')
          .eq('user_id', data.id)
          .order('week_start', { ascending: false })
          .limit(1);

        if (analysis?.[0]?.analysis) {
          const a = analysis[0].analysis as any;
          const pd: PersonalityData = {
            type: a.type || a.personalityType || undefined,
            description: a.description || undefined,
            traits: a.traits || [],
            advice: a.advice || undefined,
            insight: a.insight || undefined,
          };
          setPersonality(pd);
          if (pd.type) {
            document.title = `${displayName} — "${pd.type}" | Directly`;
          }
        }
      }
      setIsLoading(false);
    };
    fetchProfile();
  }, [username]);

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

  // Private profile — show basic info only
  if (profile && !profile.is_public && profile.id !== user?.id) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <Lock className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-bold mb-1">{profile.display_name || profile.username}</h1>
        <p className="text-sm text-muted-foreground mb-1">@{profile.username}</p>
        {profile.bio && <p className="text-sm text-muted-foreground mb-4 max-w-xs text-center">{profile.bio}</p>}
        <p className="text-muted-foreground text-sm mb-6">{l.privateProfile}</p>
        <Button onClick={() => navigate('/')} variant="outline" className="rounded-xl">
          <ArrowLeft className="h-4 w-4 me-2" />
          {l.goBack}
        </Button>
      </div>
    );
  }

  const firstName = profile?.display_name?.split(' ')[0] || '';

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
          <button
            onClick={() => profile?.username && copyUsername(profile.username, l.usernameCopied)}
            className="text-muted-foreground hover:text-primary transition-colors mb-3 inline-block"
          >
            @{profile?.username}
          </button>

          {profile?.bio && (
            <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">{profile.bio}</p>
          )}

          {/* Personality analysis — visible to everyone on public profiles */}
          {personality && (
            <PersonalityAnalysis personality={personality} labels={l} firstName={firstName} />
          )}

          {/* Action buttons */}
          <ProfileActions
            isLoggedIn={!!user}
            isOwnProfile={profile?.id === user?.id}
            personalityType={personality?.type}
            labels={l}
            onSendMessage={() => setShowComposer(true)}
            onShare={() => profile?.username && shareProfile(
              profile.display_name || profile.username,
              profile.username,
              personality?.type,
              l.linkCopied
            )}
            onCopyUsername={() => profile?.username && copyUsername(profile.username, l.usernameCopied)}
          />
        </Card>

        {/* CTA for non-logged-in visitors */}
        {!user && (
          <Card className="mt-4 p-5 text-center border-primary/10 bg-primary/5">
            <Sparkles className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-sm font-semibold mb-2">{l.discoverStyle}</p>
            <Button onClick={() => navigate('/')} size="sm" className="rounded-xl">
              {l.joinDirectly}
            </Button>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground mt-8">
          Directly — Smart Communication
        </p>
      </div>

      {profile && (
        <MessageComposer
          isOpen={showComposer}
          onClose={() => setShowComposer(false)}
          recipient={profile}
          onMessageSent={() => { setShowComposer(false); toast.success('Sent ✨'); }}
        />
      )}
    </div>
  );
}
