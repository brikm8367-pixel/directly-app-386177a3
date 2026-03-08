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
import { BottomNavigation } from '@/components/BottomNavigation';
import { toast } from 'sonner';
import { Camera, User, Loader2, Check, Mail, AtSign, FileText, Shield, LogOut, Trash2 } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_public: boolean | null;
}

export default function ProfilePage() {
  const { user, loading, signOut } = useAuth();
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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
      const { data } = await supabase
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

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

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

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
      toast.success(isRTL ? 'تم الحفظ ✨' : 'Saved ✨');
    } catch (error) {
      console.error('Save error:', error);
      toast.error(isRTL ? 'فشل الحفظ' : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    try {
      await supabase.rpc('delete_user_data', { _user_id: user.id });
      await signOut();
      toast.success(isRTL ? 'تم حذف حسابك بالكامل' : 'Your account has been deleted');
      navigate('/');
    } catch {
      toast.error(isRTL ? 'فشل حذف الحساب' : 'Failed to delete account');
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="fixed top-0 right-0 left-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border safe-area-inset-top">
        <div className="max-w-lg mx-auto flex h-14 items-center justify-between px-4">
          <h1 className="font-bold text-lg">{isRTL ? 'الملف الشخصي' : 'Profile'}</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSave}
            disabled={isSaving}
            className="h-10 w-10 rounded-xl touch-feedback"
          >
            {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5 text-primary" />}
          </Button>
        </div>
      </header>

      <main className="max-w-lg mx-auto pt-16 pb-24 px-4">
        {/* Avatar */}
        <div className="flex flex-col items-center mb-6 mt-2">
          <div className="relative">
            <Avatar className="h-24 w-24 ring-3 ring-primary/20">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {displayName?.[0] || <User className="h-10 w-10" />}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute bottom-0 end-0 h-9 w-9 rounded-full bg-primary text-primary-foreground shadow-md flex items-center justify-center touch-feedback"
            >
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">{isRTL ? 'اضغط لتغيير الصورة' : 'Tap to change photo'}</p>
          {username && (
            <button
              onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/@${username}`); toast.success(isRTL ? 'تم نسخ رابطك' : 'Your link copied!'); }}
              className="mt-1 text-xs text-primary font-medium hover:underline"
            >
              @{username}
            </button>
          )}
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-2 text-sm">
              <User className="h-3.5 w-3.5 text-primary" />
              {isRTL ? 'الاسم الظاهر' : 'Display Name'}
            </Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={isRTL ? 'محمد أحمد' : 'John Doe'} className="h-12 text-base rounded-xl" />
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-2 text-sm">
              <AtSign className="h-3.5 w-3.5 text-primary" />
              {isRTL ? 'اسم المستخدم' : 'Username'}
            </Label>
            <Input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} placeholder="username" className="h-12 text-base rounded-xl" dir="ltr" maxLength={20} />
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-2 text-sm">
              <Mail className="h-3.5 w-3.5 text-primary" />
              {isRTL ? 'البريد الإلكتروني' : 'Email'}
            </Label>
            <Input value={user?.email || ''} disabled className="h-12 text-base rounded-xl bg-muted/50" />
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-2 text-sm">
              <FileText className="h-3.5 w-3.5 text-primary" />
              {isRTL ? 'نبذة عنك' : 'About you'}
            </Label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder={isRTL ? 'اكتب نبذة مختصرة...' : 'Write a short bio...'} className="min-h-[80px] text-base rounded-xl resize-none" maxLength={200} />
            <p className="text-xs text-muted-foreground text-end">{bio.length}/200</p>
          </div>

          {/* Privacy toggle */}
          <div className="p-4 rounded-2xl bg-card border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{isRTL ? 'ملف شخصي عام' : 'Public Profile'}</p>
                  <p className="text-xs text-muted-foreground">{isRTL ? 'يمكن للآخرين إيجادك' : 'Others can find you'}</p>
                </div>
              </div>
              <button
                onClick={() => setIsPublic(!isPublic)}
                className={`w-12 h-7 rounded-full transition-colors ${isPublic ? 'bg-primary' : 'bg-muted'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${isPublic ? (isRTL ? '-translate-x-0.5' : 'translate-x-6') : (isRTL ? '-translate-x-6' : 'translate-x-0.5')}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Save */}
        <Button onClick={handleSave} disabled={isSaving} className="w-full h-13 mt-6 text-base font-semibold rounded-2xl glow-gold">
          {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : isRTL ? 'حفظ التغييرات' : 'Save Changes'}
        </Button>

        {/* Legal links — App Store / Play Store compliance */}
        <div className="mt-6 p-4 rounded-2xl bg-card border border-border space-y-2">
          <a href="/privacy" className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors touch-feedback">
            <span className="text-sm font-medium">{isRTL ? 'سياسة الخصوصية' : 'Privacy Policy'}</span>
            <span className="text-xs text-muted-foreground">→</span>
          </a>
          <a href="/terms" className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors touch-feedback">
            <span className="text-sm font-medium">{isRTL ? 'شروط الخدمة' : 'Terms of Service'}</span>
            <span className="text-xs text-muted-foreground">→</span>
          </a>
        </div>

        {/* Sign Out */}
        <Button variant="ghost" onClick={handleSignOut} className="w-full mt-3 h-12 text-destructive rounded-xl">
          <LogOut className="h-4 w-4 me-2" />
          {isRTL ? 'تسجيل الخروج' : 'Sign Out'}
        </Button>

        {/* Delete Account — GDPR compliance */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" className="w-full mt-1 h-12 text-destructive/60 rounded-xl text-xs">
              <Trash2 className="h-3.5 w-3.5 me-2" />
              {isRTL ? 'حذف الحساب نهائياً' : 'Delete Account Permanently'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>{isRTL ? 'حذف الحساب؟' : 'Delete Account?'}</AlertDialogTitle>
              <AlertDialogDescription>
                {isRTL
                  ? 'سيتم حذف جميع بياناتك ورسائلك نهائياً. هذا الإجراء غير قابل للتراجع.'
                  : 'All your data and messages will be permanently deleted. This action cannot be undone.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">{isRTL ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground rounded-xl">
                {isRTL ? 'حذف نهائياً' : 'Delete Forever'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <p className="text-center text-xs text-muted-foreground mt-4 mb-2">Directly v1.0 · © 2026</p>
      </main>

      <BottomNavigation />
    </div>
  );
}
