import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, Lock, Eye, EyeOff, Server, KeyRound, 
  Globe, ArrowLeft, ArrowRight, Fingerprint,
  Database, Ban, Smartphone, LogOut, Timer, Camera, Shield, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { BottomNavigation } from '@/components/BottomNavigation';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ease: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

interface SecurityCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  delay?: number;
}

function SecurityCard({ icon, title, description, badge, delay = 0 }: SecurityCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease }}
      className="relative p-5 rounded-2xl bg-card border border-border hover:border-primary/20 transition-colors group"
    >
      {badge && (
        <span className="absolute top-3 end-3 text-[10px] font-semibold tracking-widest uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
      <div className="p-2.5 rounded-xl bg-primary/10 w-fit mb-3 group-hover:bg-primary/15 transition-colors">
        {icon}
      </div>
      <h3 className="font-semibold text-base mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </motion.div>
  );
}

export default function Security() {
  const { isRTL, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;
  const [screenshotAlert, setScreenshotAlert] = useState(
    localStorage.getItem('directly_screenshot_alert') !== 'false'
  );

  const toggleScreenshotAlert = (val: boolean) => {
    setScreenshotAlert(val);
    localStorage.setItem('directly_screenshot_alert', val.toString());
    toast.success(val 
      ? (isRTL ? 'سيتم تنبيهك عند التقاط صورة للشاشة' : 'Screenshot alerts enabled') 
      : (isRTL ? 'تم إيقاف تنبيهات التقاط الشاشة' : 'Screenshot alerts disabled'));
  };

  const handleLogoutAllDevices = async () => {
    if (!user) return;
    await supabase.auth.signOut({ scope: 'global' });
    toast.success(isRTL ? 'تم تسجيل الخروج من جميع الأجهزة' : 'Signed out from all devices');
    navigate('/');
  };

  const content = {
    ar: {
      title: 'الأمان والخصوصية',
      subtitle: 'بُني من الأساس لحماية خصوصيتك',
      heroText: 'رسائلك مشفرة من طرف إلى طرف. لا نقرأها، لا نخزنها، ولا نبيعها. أنت وحدك من يملك مفاتيح محادثاتك.',
      activeDevices: 'الأجهزة المتصلة',
      logoutAll: 'تسجيل خروج من جميع الأجهزة',
      screenshotDetection: 'تنبيه التقاط الشاشة',
      screenshotDesc: 'عند التقاط أحد صورة للشاشة، سيتم تنبيه الطرف الآخر تلقائياً.',
      disappearingMsgs: 'الرسائل المؤقتة',
      disappearingDesc: 'يمكنك ضبط مؤقت داخل أي محادثة لجعل الرسائل تختفي تلقائياً.',
      twoFA: 'المصادقة الثنائية (2FA)',
      twoFADesc: 'حماية إضافية لحسابك. يمكنك تفعيلها من إعدادات حسابك.',
      comparison: 'كيف يقارن Directly؟',
    },
    en: {
      title: 'Security & Privacy',
      subtitle: 'Built from the ground up to protect your privacy',
      heroText: 'Your messages are end-to-end encrypted. We can\'t read them, we don\'t store them, and we never sell them. Only you hold the keys to your conversations.',
      activeDevices: 'Active Devices',
      logoutAll: 'Sign out from all devices',
      screenshotDetection: 'Screenshot Detection',
      screenshotDesc: 'When someone takes a screenshot, the other party is automatically notified.',
      disappearingMsgs: 'Disappearing Messages',
      disappearingDesc: 'Set a timer inside any conversation to make messages auto-delete.',
      twoFA: 'Two-Factor Authentication (2FA)',
      twoFADesc: 'Extra protection for your account. Enable it from your account settings.',
      comparison: 'How does Directly compare?',
    },
  };

  const c = isRTL ? content.ar : content.en;

  const securityFeatures = isRTL ? [
    { icon: <Lock className="h-5 w-5 text-primary" />, title: 'تشفير من طرف إلى طرف', description: 'كل رسالة مشفرة باستخدام AES-256-GCM مع مفاتيح ECDH فريدة.', badge: 'AES-256' },
    { icon: <KeyRound className="h-5 w-5 text-primary" />, title: 'مفاتيح تشفير خاصة بك', description: 'يتم إنشاء زوج مفاتيح ECDH (P-256) فريد لكل مستخدم. المفتاح الخاص لا يغادر جهازك أبداً.' },
    { icon: <EyeOff className="h-5 w-5 text-primary" />, title: 'بدون تتبع أو إعلانات', description: 'لا نتتبع نشاطك، لا نبيع بياناتك، ولا نعرض إعلانات.', badge: 'ZERO ADS' },
    { icon: <Globe className="h-5 w-5 text-primary" />, title: 'متوافق مع GDPR', description: 'نلتزم بأعلى معايير حماية البيانات الأوروبية والدولية.', badge: 'GDPR' },
    { icon: <Server className="h-5 w-5 text-primary" />, title: 'بنية تحتية آمنة', description: 'بيانات مشفرة أثناء النقل عبر TLS 1.3 وأثناء التخزين.' },
    { icon: <Fingerprint className="h-5 w-5 text-primary" />, title: 'مصادقة متعددة الطبقات', description: 'تسجيل دخول آمن مع التحقق من البريد الإلكتروني.' },
    { icon: <Database className="h-5 w-5 text-primary" />, title: 'حذف البيانات بالكامل', description: 'يمكنك حذف حسابك وجميع بياناتك بشكل نهائي في أي وقت.' },
    { icon: <Ban className="h-5 w-5 text-primary" />, title: 'حماية من الرسائل المزعجة', description: 'نظام حدود ذكي لكل صندوق يمنع الفيضان ويحمي تركيزك.' },
  ] : [
    { icon: <Lock className="h-5 w-5 text-primary" />, title: 'End-to-End Encryption', description: 'Every message is encrypted using AES-256-GCM with unique ECDH keys.', badge: 'AES-256' },
    { icon: <KeyRound className="h-5 w-5 text-primary" />, title: 'Your Keys, Your Device', description: 'A unique ECDH (P-256) key pair is generated for each user. Your private key never leaves your device.' },
    { icon: <EyeOff className="h-5 w-5 text-primary" />, title: 'No Tracking · No Ads', description: 'We don\'t track your activity, sell your data, or show ads.', badge: 'ZERO ADS' },
    { icon: <Globe className="h-5 w-5 text-primary" />, title: 'GDPR Compliant', description: 'We comply with the highest European and international data protection standards.', badge: 'GDPR' },
    { icon: <Server className="h-5 w-5 text-primary" />, title: 'Secure Infrastructure', description: 'Data encrypted in transit via TLS 1.3 and at rest. Strict RLS policies.' },
    { icon: <Fingerprint className="h-5 w-5 text-primary" />, title: 'Multi-Layer Authentication', description: 'Secure sign-in with email verification and fake account protection.' },
    { icon: <Database className="h-5 w-5 text-primary" />, title: 'Full Data Deletion', description: 'Delete your account and all data permanently at any time.' },
    { icon: <Ban className="h-5 w-5 text-primary" />, title: 'Spam Protection', description: 'Smart per-inbox limits prevent flooding and protect your focus.' },
  ];

  const comparisonFeatures = [
    { feature: isRTL ? 'تشفير E2E' : 'E2E Encryption', directly: true, whatsapp: true, telegram: '⚡', signal: true },
    { feature: isRTL ? 'بدون إعلانات' : 'No Ads', directly: true, whatsapp: false, telegram: true, signal: true },
    { feature: isRTL ? 'رسائل مؤقتة' : 'Disappearing Messages', directly: true, whatsapp: true, telegram: true, signal: true },
    { feature: isRTL ? 'تنبيه التقاط الشاشة' : 'Screenshot Detection', directly: true, whatsapp: false, telegram: false, signal: false },
    { feature: isRTL ? 'تحكم بالوصول' : 'Access Control', directly: true, whatsapp: false, telegram: false, signal: false },
    { feature: isRTL ? 'صناديق ذكية' : 'Smart Inboxes', directly: true, whatsapp: false, telegram: false, signal: false },
    { feature: isRTL ? 'تعديل الرسائل' : 'Message Editing', directly: true, whatsapp: true, telegram: true, signal: false },
    { feature: isRTL ? 'حذف كامل للبيانات' : 'Full Data Delete', directly: true, whatsapp: false, telegram: true, signal: true },
  ];

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <header className="fixed top-0 right-0 left-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border safe-area-inset-top">
        <div className="max-w-2xl mx-auto flex h-14 items-center px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl">
            <BackIcon className="h-5 w-5" />
          </Button>
          <div className="flex-1 text-center">
            <h1 className="text-sm font-semibold flex items-center justify-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              {c.title}
            </h1>
          </div>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto pt-20 pb-24 px-4 space-y-8">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }} className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
            <ShieldCheck className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold mb-3">{c.subtitle}</h2>
          <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">{c.heroText}</p>
        </motion.div>

        {/* Active Security Controls */}
        {user && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-3">
            {/* Screenshot Detection Toggle */}
            <Card className="p-4 flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-amber-500/10">
                <Camera className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{c.screenshotDetection}</p>
                <p className="text-xs text-muted-foreground">{c.screenshotDesc}</p>
              </div>
              <Switch checked={screenshotAlert} onCheckedChange={toggleScreenshotAlert} />
            </Card>

            {/* Disappearing Messages Info */}
            <Card className="p-4 flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Timer className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{c.disappearingMsgs}</p>
                <p className="text-xs text-muted-foreground">{c.disappearingDesc}</p>
              </div>
              <Shield className="h-5 w-5 text-emerald-500" />
            </Card>

            {/* 2FA Info */}
            <Card className="p-4 flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-blue-500/10">
                <Fingerprint className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{c.twoFA}</p>
                <p className="text-xs text-muted-foreground">{c.twoFADesc}</p>
              </div>
              <span className="text-[10px] font-semibold uppercase text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-full">
                {isRTL ? 'قريباً' : 'Soon'}
              </span>
            </Card>

            {/* Device Sessions */}
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-violet-500/10">
                  <Smartphone className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <p className="font-semibold text-sm">{c.activeDevices}</p>
              </div>
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  <Smartphone className="h-4 w-4 text-emerald-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{isRTL ? 'هذا الجهاز' : 'This device'}</p>
                    <p className="text-xs text-muted-foreground">{navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'} · {isRTL ? 'نشط الآن' : 'Active now'}</p>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
              </div>
              <Button variant="outline" onClick={handleLogoutAllDevices} className="w-full rounded-xl text-destructive hover:text-destructive">
                <LogOut className="h-4 w-4 me-2" />
                {c.logoutAll}
              </Button>
            </Card>
          </motion.div>
        )}

        {/* Security Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {securityFeatures.map((section, i) => (
            <SecurityCard
              key={i}
              icon={section.icon}
              title={section.title}
              description={section.description}
              badge={section.badge}
              delay={i * 0.04}
            />
          ))}
        </div>

        {/* Comparison Table */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4, ease }} className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-semibold text-lg mb-4 text-center">{c.comparison}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-start py-2 font-medium text-muted-foreground"></th>
                  <th className="py-2 font-semibold text-primary">Directly</th>
                  <th className="py-2 font-medium text-muted-foreground">WhatsApp</th>
                  <th className="py-2 font-medium text-muted-foreground">Telegram</th>
                  <th className="py-2 font-medium text-muted-foreground">Signal</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((row, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0">
                    <td className="py-2.5 text-start font-medium">{row.feature}</td>
                    <td className="py-2.5 text-center">{row.directly ? <span className="text-emerald-600">✓</span> : '—'}</td>
                    <td className="py-2.5 text-center">{row.whatsapp === true ? <span className="text-emerald-600">✓</span> : row.whatsapp === false ? '—' : row.whatsapp}</td>
                    <td className="py-2.5 text-center">{row.telegram === true ? <span className="text-emerald-600">✓</span> : row.telegram === false ? '—' : row.telegram}</td>
                    <td className="py-2.5 text-center">{row.signal === true ? <span className="text-emerald-600">✓</span> : row.signal === false ? '—' : row.signal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="text-center text-xs text-muted-foreground leading-relaxed">
          {isRTL 
            ? 'Directly مبني على بنية تحتية مفتوحة المصدر مع التزام كامل بمعايير الأمان العالمية.'
            : 'Directly is built on open-source infrastructure with full commitment to global security standards.'}
        </motion.p>
      </main>

      <BottomNavigation />
    </div>
  );
}
