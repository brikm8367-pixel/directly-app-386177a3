import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MessageSquare, Loader2, Eye, EyeOff } from 'lucide-react';
import { lovable } from '@/integrations/lovable/index';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  username: z.string().min(3).max(15).regex(/^[a-zA-Z0-9_]+$/),
  displayName: z.string().min(2).max(50),
});

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  const { signIn, signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  // Auth pages always render in English
  const isRTL = false;

  useEffect(() => {
    if (!loading && user) {
      navigate('/home');
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        const validation = loginSchema.safeParse({ email, password });
        if (!validation.success) {
          setError(isRTL ? 'تأكد من صحة البريد الإلكتروني وكلمة المرور' : 'Please check your email and password');
          setIsLoading(false);
          return;
        }

        const { error: signInError } = await signIn(email, password);
        if (signInError) {
          if (signInError.message.includes('Invalid login credentials')) {
            setError(isRTL ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : 'Invalid email or password');
          } else {
            setError(isRTL ? 'حدث خطأ، حاول مرة أخرى' : 'An error occurred, please try again');
          }
        }
      } else {
        const validation = signupSchema.safeParse({ email, password, username, displayName });
        if (!validation.success) {
          const firstError = validation.error.errors[0];
          if (firstError?.path[0] === 'username') {
            setError('Username must be 3-15 characters (letters, numbers, _ only)');
          } else if (firstError?.path[0] === 'displayName') {
            setError(isRTL ? 'الاسم يجب أن يكون حرفين على الأقل' : 'Display name must be at least 2 characters');
          } else if (firstError?.path[0] === 'email') {
            setError(isRTL ? 'أدخل بريد إلكتروني صحيح' : 'Please enter a valid email');
          } else if (firstError?.path[0] === 'password') {
            setError(isRTL ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
          }
          setIsLoading(false);
          return;
        }

        const { error: signUpError } = await signUp(email, password, username, displayName);
        if (signUpError) {
          if (signUpError.message.includes('already registered')) {
            setError(isRTL ? 'هذا البريد الإلكتروني مسجل مسبقاً' : 'This email is already registered');
          } else {
            setError(isRTL ? 'حدث خطأ، حاول مرة أخرى' : 'An error occurred, please try again');
          }
        }
      }
    } catch {
      setError(isRTL ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setEmail('');
    setPassword('');
    setUsername('');
    setDisplayName('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">{isRTL ? 'جاري التحميل...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <MessageSquare className="h-7 w-7" />
          </div>
          <span className="text-2xl font-bold text-foreground">Directly</span>
          <p className="text-sm text-muted-foreground text-center">
            {isRTL ? 'تحكم في من يصل إليك' : 'Control who reaches you'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl p-6 border border-border shadow-lg">
          <h1 className="text-xl font-semibold text-center mb-6">
            {isLogin 
              ? (isRTL ? 'تسجيل الدخول' : 'Sign In') 
              : (isRTL ? 'إنشاء حساب جديد' : 'Create Account')}
          </h1>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive text-center">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">
                    {isRTL ? 'اسم المستخدم' : 'Username'}
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="username"
                    className="h-11"
                    autoComplete="username"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-sm font-medium">
                    {isRTL ? 'الاسم الظاهر' : 'Display Name'}
                  </Label>
                  <Input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={isRTL ? 'محمد أحمد' : 'John Doe'}
                    className="h-11"
                    autoComplete="name"
                    disabled={isLoading}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                {isRTL ? 'البريد الإلكتروني' : 'Email'}
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="h-11"
                autoComplete="email"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                {isRTL ? 'كلمة المرور' : 'Password'}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 pe-10"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 font-medium" 
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                isLogin 
                  ? (isRTL ? 'دخول' : 'Sign In')
                  : (isRTL ? 'إنشاء حساب' : 'Create Account')
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>

          {/* Google OAuth */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 font-medium gap-3"
            disabled={isLoading}
            onClick={async () => {
              setIsLoading(true);
              setError('');
              const { error } = await lovable.auth.signInWithOAuth("google", {
                redirect_uri: window.location.origin,
              });
              if (error) {
                setError('Failed to sign in with Google');
              }
              setIsLoading(false);
            }}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </Button>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={switchMode}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
              disabled={isLoading}
            >
              {isLogin 
                ? (isRTL ? 'ليس لديك حساب؟ ' : "Don't have an account? ")
                : (isRTL ? 'لديك حساب؟ ' : 'Already have an account? ')}
              <span className="font-medium text-primary">
                {isLogin 
                  ? (isRTL ? 'إنشاء حساب' : 'Sign Up')
                  : (isRTL ? 'تسجيل الدخول' : 'Sign In')}
              </span>
            </button>
          </div>
        </div>

        {/* About link */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/welcome')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {isRTL ? 'ما هو Directly؟' : 'What is Directly?'}
          </button>
        </div>
      </div>
    </div>
  );
}
