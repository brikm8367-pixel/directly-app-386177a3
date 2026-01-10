import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Camera, Loader2, Check, Info } from 'lucide-react';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_public: boolean | null;
  created_at: string | null;
}

export function ProfilePage() {
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  // Form state
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data && !error) {
        setProfile(data);
        setDisplayName(data.display_name || '');
        setUsername(data.username || '');
        setBio(data.bio || '');
        setIsPublic(data.is_public ?? true);
      }
      setIsLoading(false);
    };

    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName,
        username: username,
        bio: bio,
        is_public: isPublic,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    setIsSaving(false);

    if (error) {
      toast.error(isRTL ? 'حدث خطأ أثناء الحفظ' : 'Error saving profile');
    } else {
      setIsSaved(true);
      toast.success(t.profile.saved);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // For now, show a message that avatar upload requires storage setup
    toast.info(isRTL ? 'رفع الصور سيكون متاحاً قريباً' : 'Avatar upload coming soon');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const memberSince = profile?.created_at 
    ? new Date(profile.created_at).toLocaleDateString(isRTL ? 'ar' : 'en', { year: 'numeric', month: 'long' })
    : '';

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Feature Description */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="flex items-center gap-3 py-3">
          <Info className="h-5 w-5 text-primary shrink-0" />
          <p className="text-sm text-muted-foreground">{t.featureDescriptions.profile}</p>
        </CardContent>
      </Card>

      {/* Profile Card */}
      <Card>
        <CardHeader className="text-center pb-2">
          <div className="mx-auto relative group cursor-pointer" onClick={handleAvatarClick}>
            <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                {displayName?.[0]?.toUpperCase() || <User className="h-8 w-8" />}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="h-6 w-6 text-white" />
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          <CardTitle className="mt-4">{t.profile.title}</CardTitle>
          <CardDescription>
            {t.profile.memberSince}: {memberSince}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">{t.profile.displayName}</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t.profile.displayName}
            />
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">{t.profile.username}</Label>
            <div className="relative">
              <span className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                placeholder={t.profile.username}
                className="ps-8"
              />
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">{t.profile.bio}</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t.profile.bioPlaceholder}
              rows={3}
              maxLength={160}
            />
            <p className="text-xs text-muted-foreground text-end">{bio.length}/160</p>
          </div>

          {/* Public Profile Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="space-y-0.5">
              <Label htmlFor="public" className="text-sm font-medium">{t.profile.publicProfile}</Label>
              <p className="text-xs text-muted-foreground">{t.profile.publicProfileDesc}</p>
            </div>
            <Switch
              id="public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>

          {/* Save Button */}
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="w-full"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin me-2" />
                {t.profile.saving}
              </>
            ) : isSaved ? (
              <>
                <Check className="h-4 w-4 me-2" />
                {t.profile.saved}
              </>
            ) : (
              t.profile.save
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
