import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { 
  ArrowLeft, ArrowRight, Camera, User, Loader2, Check, 
  Mail, AtSign, FileText, Shield, Crown
} from 'lucide-react';

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
  const { isRTL, t } = useLanguage();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (!loading && !user) {
      navigate('/');
    }
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

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error(isRTL ? 'يرجى اختيار صورة' : 'Please select an image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(isRTL ? 'الصورة كبيرة جداً (الحد 5 ميغابايت)' : 'Image too large (max 5MB)');
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
      toast.success(isRTL ? 'تم تحديث الصورة ✨' : 'Photo updated ✨');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(isRTL ? 'فشل رفع الصورة' : 'Failed to upload photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim() || null,
          username: username.trim().toLowerCase() || null,
          bio: bio.trim() || null,
          is_public: isPublic,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success(isRTL ? 'تم الحفظ بنجاح ✨' : 'Saved successfully ✨');
    } catch (error) {
      console.error('Save error:', error);
      toast.error(isRTL ? 'فشل الحفظ' : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="fixed top-0 right-0 left-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto flex h-16 items-center justify-between px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/home')}
            className="h-11 w-11 rounded-xl touch-feedback"
          >
            <BackIcon className="h-5 w-5" />
          </Button>
          <h1 className="font-bold text-lg">
            {isRTL ? 'الملف الشخصي' : 'Profile'}
          </h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSave}
            disabled={isSaving}
            className="h-11 w-11 rounded-xl touch-feedback"
          >
            {isSaving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Check className="h-5 w-5 text-primary" />
            )}
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto pt-24 pb-8 px-4">
        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <Avatar className="h-28 w-28 ring-4 ring-primary/20">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                {displayName?.[0] || <User className="h-12 w-12" />}
              </AvatarFallback>
            </Avatar>
            
            <button
              onClick={handleAvatarClick}
              disabled={isUploading}
              className="absolute bottom-0 end-0 h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center touch-feedback"
            >
              {isUploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Camera className="h-5 w-5" />
              )}
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          
          <p className="text-sm text-muted-foreground mt-3">
            {isRTL ? 'اضغط على الكاميرا لتغيير الصورة' : 'Tap camera to change photo'}
          </p>
        </div>

        {/* Premium Badge */}
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Crown className="h-6 w-6 text-primary animate-crown" />
            </div>
            <div>
              <p className="font-semibold text-foreground">
                {isRTL ? 'أنت ملك وقتك' : "You're the king of your time"}
              </p>
              <p className="text-sm text-muted-foreground">
                {isRTL ? 'تحكم كامل في من يصل إليك' : 'Full control over who reaches you'}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-5">
          {/* Display Name */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4 text-primary" />
              {isRTL ? 'الاسم الظاهر' : 'Display Name'}
            </Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={isRTL ? 'محمد أحمد' : 'John Doe'}
              className="h-12 text-base rounded-xl"
            />
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <AtSign className="h-4 w-4 text-primary" />
              {isRTL ? 'اسم المستخدم' : 'Username'}
            </Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="username"
              className="h-12 text-base rounded-xl"
              dir="ltr"
            />
          </div>

          {/* Email (read-only) */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Mail className="h-4 w-4 text-primary" />
              {isRTL ? 'البريد الإلكتروني' : 'Email'}
            </Label>
            <Input
              value={user?.email || ''}
              disabled
              className="h-12 text-base rounded-xl bg-muted/50"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4 text-primary" />
              {isRTL ? 'نبذة عنك' : 'About you'}
            </Label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={isRTL ? 'اكتب نبذة مختصرة عنك...' : 'Write a short bio...'}
              className="min-h-[100px] text-base rounded-xl resize-none"
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground text-end">
              {bio.length}/200
            </p>
          </div>

          {/* Privacy */}
          <div className="p-4 rounded-2xl bg-card border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {isRTL ? 'ملف شخصي عام' : 'Public Profile'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isRTL ? 'يمكن للآخرين إيجادك' : 'Others can find you'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPublic(!isPublic)}
                className={`w-14 h-8 rounded-full transition-colors ${
                  isPublic ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
                    isPublic 
                      ? (isRTL ? '-translate-x-1' : 'translate-x-7')
                      : (isRTL ? '-translate-x-7' : 'translate-x-1')
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full h-14 mt-8 text-lg font-semibold rounded-2xl glow-gold"
        >
          {isSaving ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            isRTL ? 'حفظ التغييرات' : 'Save Changes'
          )}
        </Button>
      </main>
    </div>
  );
}
