import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/i18n/LanguageContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { User, Loader2, ArrowLeft, Lock, Sparkles, Send, Share2, Copy, MessageCircle, Camera } from 'lucide-react';
import { toast } from 'sonner';
import MessageComposer from '@/components/messaging/MessageComposer';
import { getProfileUrl, copyUsername } from '@/utils/sharing';

interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_public: boolean | null;
}

interface PersonalitySummary {
  type?: string;
  description?: string;
  traits?: string[];
  advice?: string;
  responsePattern?: string;
}

const LABELS: Record<string, Record<string, string>> = {
  ar: {
    sendMessage: 'إرسال رسالة', talkTo: 'تحدث مع', goBack: 'العودة',
    privateProfile: 'هذا الملف خاص', userNotFound: 'لم يتم العثور على هذا المستخدم',
    commStyle: 'نمط التواصل', shareProfile: 'شارك', linkCopied: 'تم نسخ الرابط!',
    usernameCopied: 'تم نسخ اسم المستخدم', bestWay: 'أفضل طريقة للتواصل مع',
    responsePattern: 'نمط الاستجابة', joinDirectly: 'انضم إلى Directly',
    discoverStyle: 'اكتشف نمط تواصلك', traits: 'السمات البارزة',
    changeAvatar: 'تغيير الصورة', removeAvatar: 'إزالة الصورة',
  },
  en: {
    sendMessage: 'Send Message', talkTo: 'Talk to', goBack: 'Go back',
    privateProfile: 'This profile is private', userNotFound: 'User not found',
    commStyle: 'Communication Style', shareProfile: 'Share', linkCopied: 'Link copied!',
    usernameCopied: 'Username copied', bestWay: 'Best way to reach',
    responsePattern: 'Response Pattern', joinDirectly: 'Join Directly',
    discoverStyle: 'Discover your communication style', traits: 'Key Traits',
    changeAvatar: 'Change Photo', removeAvatar: 'Remove Photo',
  },
  fr: {
    sendMessage: 'Envoyer un message', talkTo: 'Parler à', goBack: 'Retour',
    privateProfile: 'Ce profil est privé', userNotFound: 'Utilisateur introuvable',
    commStyle: 'Style de communication', shareProfile: 'Partager', linkCopied: 'Lien copié!',
    usernameCopied: 'Nom copié', bestWay: 'Meilleure façon de contacter',
    responsePattern: 'Schéma de réponse', joinDirectly: 'Rejoindre Directly',
    discoverStyle: 'Découvrez votre style', traits: 'Traits clés',
    changeAvatar: 'Changer la photo', removeAvatar: 'Supprimer la photo',
  },
  es: {
    sendMessage: 'Enviar mensaje', talkTo: 'Hablar con', goBack: 'Volver',
    privateProfile: 'Este perfil es privado', userNotFound: 'Usuario no encontrado',
    commStyle: 'Estilo de comunicación', shareProfile: 'Compartir', linkCopied: 'Enlace copiado!',
    usernameCopied: 'Usuario copiado', bestWay: 'Mejor forma de contactar',
    responsePattern: 'Patrón de respuesta', joinDirectly: 'Unirse a Directly',
    discoverStyle: 'Descubre tu estilo', traits: 'Rasgos clave',
    changeAvatar: 'Cambiar foto', removeAvatar: 'Eliminar foto',
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
  const [personality, setPersonality] = useState<PersonalitySummary | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const l = LABELS[language] || LABELS.en;
  const isOwnProfile = profile?.id === user?.id;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) return;
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
      const displayName = data.display_name || cleanUsername;
      document.title = `${displayName} — Directly`;

      // Load personality for public profiles — get LAST COMPLETED week (not current)
      if (data.is_public) {
        const { data: analysis } = await supabase
          .from('weekly_analysis')
          .select('analysis, week_start')
          .eq('user_id', data.id)
          .order('week_start', { ascending: false })
          .limit(1);

        if (analysis?.[0]?.analysis) {
          const a = analysis[0].analysis as any;
          const pd: PersonalitySummary = {
            type: a.type || undefined,
            description: a.description || undefined,
            traits: a.traits || [],
            advice: a.advice || undefined,
            responsePattern: a.insight || undefined,
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

  const handleShare = async () => {
    if (!profile?.username) return;
    const url = getProfileUrl(profile.username);
    const displayName = profile.display_name || profile.username;
    const shareText = personality?.type
      ? `${displayName} is a "${personality.type}" communicator on Directly ✨`
      : `Check out ${displayName} on Directly`;

    try {
      if (navigator.share) {
        await navigator.share({ title: `${displayName} — Directly`, text: shareText, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success(l.linkCopied);
      }
    } catch (err: any) {
      // If share was cancelled, ignore. Otherwise copy to clipboard as fallback.
      if (err?.name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(url);
          toast.success(l.linkCopied);
        } catch { /* ignore */ }
      }
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !isOwnProfile) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('JPG, PNG or WebP only');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Max 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const avatar_url = `${urlData.publicUrl}?t=${Date.now()}`;

      await supabase.from('profiles').update({ avatar_url, updated_at: new Date().toISOString() }).eq('id', user.id);
      setProfile(prev => prev ? { ...prev, avatar_url } : prev);
      toast.success('✨');
    } catch {
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user || !isOwnProfile) return;
    await supabase.from('profiles').update({ avatar_url: null, updated_at: new Date().toISOString() }).eq('id', user.id);
    setProfile(prev => prev ? { ...prev, avatar_url: null } : prev);
    toast.success('✨');
  };

  // Extract short personality type label for CTA
  const personalityLabel = personality?.type?.replace(/^[\p{Emoji}\s]+/u, '').trim() || '';

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

  // Private profile
  if (profile && !profile.is_public && !isOwnProfile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <Lock className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-bold mb-1">{profile.display_name || profile.username}</h1>
        <p className="text-sm text-muted-foreground mb-1">@{profile.username}</p>
        {profile.bio && <p className="text-sm text-muted-foreground mb-4 max-w-xs text-center">{profile.bio}</p>}
        <p className="text-muted-foreground text-sm mb-6">{l.privateProfile}</p>
        <Button onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/home')} variant="outline" className="rounded-xl">
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
        {/* Back button */}
        <Button variant="ghost" size="icon" onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/home')} className="mb-6 h-11 w-11 rounded-xl">
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <Card className="p-8 text-center border-primary/10">
          {/* §1 — Basic Info (visible to everyone) */}
          <div className="relative inline-block mb-4">
            <Avatar className="h-24 w-24 mx-auto ring-4 ring-primary/10">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-3xl">
                {profile?.display_name?.[0] || <User className="h-10 w-10" />}
              </AvatarFallback>
            </Avatar>
            {isOwnProfile && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -end-1 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg"
                disabled={isUploading}
              >
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
          </div>

          {isOwnProfile && profile?.avatar_url && (
            <button onClick={handleRemoveAvatar} className="text-xs text-muted-foreground hover:text-destructive mb-2 block mx-auto">
              {l.removeAvatar}
            </button>
          )}

          <h1 className="text-2xl font-bold mb-1">{profile?.display_name}</h1>
          <button
            onClick={() => profile?.username && copyUsername(profile.username, l.usernameCopied)}
            className="text-muted-foreground hover:text-primary transition-colors mb-1 inline-block"
          >
            @{profile?.username}
          </button>

          {profile?.bio && (
            <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">{profile.bio}</p>
          )}

          {/* §2 — Personality Summary (public profiles only, third-person, positive) */}
          {personality?.type && profile?.is_public && (
            <div className="mb-6 space-y-3 text-start">
              <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">{l.commStyle}</span>
                </div>
                <p className="text-xl font-bold text-foreground mb-2 text-center">{personality.type}</p>
                {personality.description && (
                  <p className="text-sm text-muted-foreground mb-3 text-center">{personality.description}</p>
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

              {personality.advice && (
                <div className="p-4 rounded-2xl bg-accent/50 border border-accent">
                  <span className="text-xs font-semibold text-primary block mb-1">💡 {l.bestWay} {firstName}</span>
                  <p className="text-sm text-foreground">{personality.advice}</p>
                </div>
              )}

              {personality.responsePattern && (
                <div className="p-4 rounded-2xl bg-muted/50 border border-border">
                  <span className="text-xs font-semibold text-primary block mb-1">🧠 {l.responsePattern}</span>
                  <p className="text-sm text-foreground">{personality.responsePattern}</p>
                </div>
              )}
            </div>
          )}

          {/* §3 — Action Buttons */}
          <div className="flex gap-3 justify-center flex-wrap">
            {user && !isOwnProfile && (
              <Button onClick={() => setShowComposer(true)} className="rounded-xl h-12 px-6 text-base">
                <Send className="h-5 w-5 me-2" />
                {personalityLabel
                  ? `${l.talkTo} ${personalityLabel}`
                  : l.sendMessage}
              </Button>
            )}
            {!user && (
              <Button onClick={() => navigate('/')} className="rounded-xl h-12 px-6 text-base">
                <MessageCircle className="h-5 w-5 me-2" />
                {l.joinDirectly}
              </Button>
            )}
            <Button variant="outline" onClick={handleShare} className="rounded-xl h-12 px-5 text-sm">
              <Share2 className="h-4 w-4 me-2" />
              {l.shareProfile}
            </Button>
            <Button variant="outline" size="icon" onClick={() => profile?.username && copyUsername(profile.username, l.usernameCopied)} className="h-12 w-12 rounded-xl">
              <Copy className="h-5 w-5" />
            </Button>
          </div>
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
