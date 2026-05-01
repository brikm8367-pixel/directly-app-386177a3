import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MessageSquare, Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { lovable } from '@/integrations/lovable/index';

const AUTH_COPY: Record<string, any> = {
  ar: {
    welcomeBack: 'مرحباً بعودتك', startJourney: 'ابدأ رحلتك',
    loginSub: 'رسائلك تنتظرك — كل شيء في مكانه.',
    signupSub: 'حسابك جاهز — رسائلك من الآن ستصل دائماً لمكانها الصحيح.',
    nameLabel: 'ما الاسم الذي تريد أن يراك به العالم؟',
    usernameLabel: 'اسمك على Directly — به سيجدك الناس.',
    emailLabelLogin: 'البريد الإلكتروني',
    emailLabelSignup: 'بريدك الإلكتروني — هذا سيكون بوابتك الخاصة.',
    passwordLabelLogin: 'كلمة المرور',
    passwordLabelSignup: 'مفتاحك الخاص — لا أحد غيرك يعرفه.',
    signIn: 'تسجيل الدخول', signUp: 'تسجيل', startBtn: 'ابدأ رحلتك',
    forgot: 'نسيت كلمة المرور؟', or: 'أو',
    googleBtn: 'المتابعة عبر Google', appleBtn: 'المتابعة عبر Apple',
    e2e: 'مشفّر — صفر تتبع', age: 'يجب أن يكون عمرك 13 عاماً أو أكثر لاستخدام Directly.',
    noAccount: 'ليس لديك حساب؟ ', hasAccount: 'لديك حساب بالفعل؟ ',
    whatIs: 'ما هو Directly؟',
    resetSent: 'تحقق من بريدك — أرسلنا لك رابط الاسترجاع.',
    errInvalid: 'مفتاحك غير صحيح — حاول مرة أخرى.',
    errExists: 'يبدو أنك عندك حساب بالفعل — سجّل الدخول.',
    errGeneric: 'شيء ما لم يعمل — رسائلك بأمان.',
    errEmail: 'الرجاء إدخال بريد صحيح',
    errPwd: 'كلمة المرور 6 أحرف على الأقل',
    errUser: 'اسم المستخدم 3-15 حرفاً (أحرف، أرقام، _ فقط)',
    errName: 'الاسم حرفان على الأقل',
    enterEmail: 'الرجاء إدخال بريدك أولاً',
  },
  en: {
    welcomeBack: 'Welcome back', startJourney: 'Start your journey',
    loginSub: 'Your messages are waiting — everything in its place.',
    signupSub: 'Your account is ready — from now on, your messages always land in the right place.',
    nameLabel: 'What name do you want the world to see you by?',
    usernameLabel: 'Your name on Directly — people will find you by it.',
    emailLabelLogin: 'Email',
    emailLabelSignup: 'Your email — this will be your private gateway.',
    passwordLabelLogin: 'Password',
    passwordLabelSignup: 'Your private key — only you know it.',
    signIn: 'Sign In', signUp: 'Sign Up', startBtn: 'Start your journey',
    forgot: tc.forgot, or: 'or',
    googleBtn: tc.googleBtn, appleBtn: tc.appleBtn,
    e2e: tc.e2e, age: tc.age,
    noAccount: "Don't have an account? ", hasAccount: 'Already have an account? ',
    whatIs: tc.whatIs,
    resetSent: tc.resetSent,
    errInvalid: 'Your key is incorrect — try again.',
    errExists: 'Looks like you already have an account — sign in.',
    errGeneric: "Something didn't work — your messages are safe.",
    errEmail: 'Please enter a valid email',
    errPwd: 'Password must be at least 6 characters',
    errUser: 'Username must be 3-15 chars (letters, numbers, _ only)',
    errName: 'Display name must be at least 2 characters',
    enterEmail: 'Please enter your email first',
  },
  fr: {
    welcomeBack: 'Bon retour', startJourney: 'Commencez votre voyage',
    loginSub: 'Vos messages vous attendent — tout à sa place.',
    signupSub: 'Votre compte est prêt — désormais vos messages arrivent toujours au bon endroit.',
    nameLabel: 'Quel nom voulez-vous que le monde voie?',
    usernameLabel: 'Votre nom sur Directly — les gens vous trouveront par lui.',
    emailLabelLogin: 'Email',
    emailLabelSignup: 'Votre email — votre porte d\'entrée privée.',
    passwordLabelLogin: 'Mot de passe',
    passwordLabelSignup: 'Votre clé privée — vous seul la connaissez.',
    signIn: 'Connexion', signUp: 'S\'inscrire', startBtn: 'Commencer',
    forgot: 'Mot de passe oublié?', or: 'ou',
    googleBtn: 'Continuer avec Google', appleBtn: 'Continuer avec Apple',
    e2e: 'Chiffré · Zéro suivi', age: 'Vous devez avoir 13 ans ou plus pour utiliser Directly.',
    noAccount: 'Pas de compte? ', hasAccount: 'Vous avez déjà un compte? ',
    whatIs: 'Qu\'est-ce que Directly?',
    resetSent: 'Vérifiez votre email — nous avons envoyé un lien.',
    errInvalid: 'Votre clé est incorrecte — réessayez.',
    errExists: 'Vous avez déjà un compte — connectez-vous.',
    errGeneric: 'Quelque chose n\'a pas marché — vos messages sont en sécurité.',
    errEmail: 'Email invalide',
    errPwd: 'Mot de passe: 6 caractères minimum',
    errUser: 'Nom: 3-15 caractères (lettres, chiffres, _)',
    errName: 'Nom: 2 caractères minimum',
    enterEmail: 'Entrez votre email d\'abord',
  },
  es: {
    welcomeBack: 'Bienvenido de nuevo', startJourney: 'Empieza tu viaje',
    loginSub: 'Tus mensajes te esperan — todo en su lugar.',
    signupSub: 'Tu cuenta está lista — desde ahora tus mensajes siempre llegan al lugar correcto.',
    nameLabel: '¿Qué nombre quieres que el mundo vea?',
    usernameLabel: 'Tu nombre en Directly — la gente te encontrará por él.',
    emailLabelLogin: 'Email',
    emailLabelSignup: 'Tu email — esta será tu puerta privada.',
    passwordLabelLogin: 'Contraseña',
    passwordLabelSignup: 'Tu clave privada — solo tú la conoces.',
    signIn: 'Iniciar sesión', signUp: 'Registrarse', startBtn: 'Empezar',
    forgot: '¿Olvidaste tu contraseña?', or: 'o',
    googleBtn: 'Continuar con Google', appleBtn: 'Continuar con Apple',
    e2e: 'Cifrado · Cero seguimiento', age: 'Debes tener 13 años o más para usar Directly.',
    noAccount: '¿No tienes cuenta? ', hasAccount: '¿Ya tienes cuenta? ',
    whatIs: '¿Qué es Directly?',
    resetSent: 'Revisa tu email — te enviamos un enlace.',
    errInvalid: 'Tu clave es incorrecta — inténtalo otra vez.',
    errExists: 'Parece que ya tienes una cuenta — inicia sesión.',
    errGeneric: 'Algo no funcionó — tus mensajes están seguros.',
    errEmail: 'Email no válido',
    errPwd: 'Contraseña: mínimo 6 caracteres',
    errUser: 'Usuario: 3-15 caracteres (letras, números, _)',
    errName: 'Nombre: mínimo 2 caracteres',
    enterEmail: 'Ingresa tu email primero',
  },
};

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
  const { language, isRTL } = useLanguage();
  const tc = AUTH_COPY[language] || AUTH_COPY.en;
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  
  const { signIn, signUp, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate('/home');
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        const validation = loginSchema.safeParse({ email, password });
        if (!validation.success) {
          setError(tc.errInvalid);
          setIsLoading(false);
          return;
        }
        const { error: signInError } = await signIn(email, password);
        if (signInError) {
          if (signInError.message.includes('Invalid login credentials')) {
            setError('Your key is incorrect — try again.');
          } else {
            setError('Something didn\'t work — your messages are safe.');
          }
        }
      } else {
        const validation = signupSchema.safeParse({ email, password, username, displayName });
        if (!validation.success) {
          const firstError = validation.error.errors[0];
          if (firstError?.path[0] === 'username') {
            setError('Username must be 3-15 characters (letters, numbers, _ only)');
          } else if (firstError?.path[0] === 'displayName') {
            setError('Display name must be at least 2 characters');
          } else if (firstError?.path[0] === 'email') {
            setError('Please enter a valid email');
          } else if (firstError?.path[0] === 'password') {
            setError('Password must be at least 6 characters');
          }
          setIsLoading(false);
          return;
        }
        const { error: signUpError } = await signUp(email, password, username, displayName);
        if (signUpError) {
          if (signUpError.message.includes('already registered')) {
            setError('Looks like you already have an account — sign in.');
          } else {
            setError('Something didn\'t work — your messages are safe.');
          }
        }
      }
    } catch {
      setError('Something didn\'t work — your messages are safe.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Please enter your email first');
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setResetSent(true);
      setError('');
    } catch {
      setError(tc.errGeneric);
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setIsForgotPassword(false);
    setResetSent(false);
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <MessageSquare className="h-7 w-7" />
          </div>
          <span className="text-2xl font-bold text-foreground">Directly</span>
          <p className="text-sm text-muted-foreground text-center max-w-[250px]">
            Smart Communication
          </p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl p-6 border border-border shadow-lg">
          <h1 className="text-xl font-semibold text-center mb-1">
            {isLogin ? tc.welcomeBack : tc.startJourney}
          </h1>
          <p className="text-xs text-muted-foreground text-center mb-6">
            {isLogin ? tc.loginSub : tc.signupSub}
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive text-center">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-sm font-medium">
                    What name do you want the world to see you by?
                  </Label>
                  <Input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="John Doe"
                    className="h-11"
                    autoComplete="name"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">
                    Your name on Directly — people will find you by it.
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
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                {isLogin ? tc.emailLabelLogin : tc.emailLabelSignup}
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
                {isLogin ? tc.passwordLabelLogin : tc.passwordLabelSignup}
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

            {isLogin && (
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs text-primary hover:underline mt-1"
                disabled={isLoading}
              >
                Forgot your password?
              </button>
            )}

            {resetSent && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 mt-2">
                <p className="text-sm text-emerald-600 dark:text-emerald-400 text-center">
                  Check your email — we sent you a recovery link.
                </p>
              </div>
            )}

            <Button type="submit" className="w-full h-11 font-medium" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                isLogin ? tc.signIn : tc.startBtn
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
              const { error } = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
              if (error) setError(tc.errGeneric);
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

          {/* Apple OAuth */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 font-medium gap-3 mt-3"
            disabled={isLoading}
            onClick={async () => {
              setIsLoading(true);
              setError('');
              const { error } = await lovable.auth.signInWithOAuth("apple", { redirect_uri: window.location.origin });
              if (error) setError(tc.errGeneric);
              setIsLoading(false);
            }}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            Continue with Apple
          </Button>

          {/* E2E Trust badge */}
          <div className="flex items-center justify-center gap-1.5 mt-4 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span className="text-[11px] font-medium">End-to-end encrypted · Zero tracking</span>
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            You must be 13 years or older to use Directly.
          </p>

          <div className="mt-5 text-center">
            <button type="button" onClick={switchMode} className="text-sm text-muted-foreground hover:text-primary transition-colors" disabled={isLoading}>
              {isLogin ? tc.noAccount : tc.hasAccount}
              <span className="font-medium text-primary">{isLogin ? tc.signUp : tc.signIn}</span>
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button onClick={() => navigate('/welcome')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            What is Directly?
          </button>
        </div>
      </div>
    </div>
  );
}
