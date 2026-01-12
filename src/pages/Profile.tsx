import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight, Camera, Loader2, Save, User, Check } from 'lucide-react';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';

interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_public: boolean | null;
}

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Form state
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate('/');
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (data) {
        setProfile(data);
        setDisplayName(data.display_name || '');
        setUsername(data.username || '');
        setBio(data.bio || '');
        setIsPublic(data.is_public ?? true);
      }
      setIsLoading(false);
    };
    
    if (user) fetchProfile();
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
    
    if (error) {
      toast.error(isRTL ? 'حدث خطأ في الحفظ' : 'Error saving profile');
    } else {
      toast.success(isRTL ? 'تم حفظ الملف الشخصي ✨' : 'Profile saved ✨');
    }
    
    setIsSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    setIsUploading(true);
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });
    
    if (uploadError) {
      toast.error(isRTL ? 'خطأ في رفع الصورة' : 'Error uploading image');
      setIsUploading(false);
      return;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id);
    
    if (updateError) {
      toast.error(isRTL ? 'خطأ في تحديث الصورة' : 'Error updating avatar');
    } else {
      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
      toast.success(isRTL ? 'تم تحديث الصورة ✨' : 'Avatar updated ✨');
    }
    
    setIsUploading(false);
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto flex h-16 items-center justify-between px-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/home')}
            className="h-11 w-11 rounded-xl"
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
          <h1 className="font-bold text-lg text-foreground">
            {isRTL ? 'الملف الشخصي' : 'Profile'}
          </h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-lg mx-auto py-6 px-4 space-y-6">
        {/* Avatar Section */}
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <div className="relative">
                <Avatar className="h-28 w-28 ring-4 ring-secondary/30">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/30 text-2xl text-foreground">
                    {displayName?.[0] || <User className="h-10 w-10" />}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute bottom-0 end-0 h-10 w-10 rounded-full bg-secondary flex items-center justify-center cursor-pointer shadow-lg hover:bg-secondary/90 transition-colors">
                  {isUploading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-secondary-foreground" />
                  ) : (
                    <Camera className="h-5 w-5 text-secondary-foreground" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={isUploading}
                  />
                </label>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                {isRTL ? 'اضغط على الكاميرا لتغيير الصورة' : 'Tap camera to change photo'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Profile Info */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">
              {isRTL ? 'المعلومات الشخصية' : 'Personal Information'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-foreground">
                {isRTL ? 'الاسم الظاهر' : 'Display Name'}
              </Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={isRTL ? 'اسمك الكامل' : 'Your full name'}
                className="h-14 text-base rounded-xl bg-background border-border text-foreground"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="username" className="text-foreground">
                {isRTL ? 'اسم المستخدم' : 'Username'}
              </Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={isRTL ? '@username' : '@username'}
                className="h-14 text-base rounded-xl bg-background border-border text-foreground"
                dir="ltr"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-foreground">
                {isRTL ? 'نبذة عنك' : 'Bio'}
              </Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={isRTL ? 'أخبرنا عن نفسك...' : 'Tell us about yourself...'}
                className="min-h-[100px] text-base rounded-xl bg-background border-border text-foreground resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">
              {isRTL ? 'الخصوصية' : 'Privacy'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">
                  {isRTL ? 'ملف شخصي عام' : 'Public Profile'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isRTL ? 'يمكن للآخرين إيجادك في البحث' : 'Others can find you in search'}
                </p>
              </div>
              <Switch
                checked={isPublic}
                onCheckedChange={setIsPublic}
                className="data-[state=checked]:bg-secondary"
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full h-14 text-lg font-bold rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-lg"
        >
          {isSaving ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Check className="h-5 w-5 me-2" />
              {isRTL ? 'حفظ التغييرات' : 'Save Changes'}
            </>
          )}
        </Button>
      </main>
    </div>
  );
}
