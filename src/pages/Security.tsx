import { motion } from 'framer-motion';
import { useLanguage } from '@/i18n/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, Lock, Eye, EyeOff, Server, KeyRound, 
  Globe, FileCheck, ArrowLeft, ArrowRight, Fingerprint,
  Database, Wifi, Ban, UserCheck, Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BottomNavigation } from '@/components/BottomNavigation';

const ease = [0.25, 0.1, 0.25, 1];

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
  const navigate = useNavigate();
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  const content = {
    ar: {
      title: 'الأمان والخصوصية',
      subtitle: 'بُني من الأساس لحماية خصوصيتك',
      heroText: 'رسائلك مشفرة من طرف إلى طرف. لا نقرأها، لا نخزنها، ولا نبيعها. أنت وحدك من يملك مفاتيح محادثاتك.',
      sections: [
        {
          icon: <Lock className="h-5 w-5 text-primary" />,
          title: 'تشفير من طرف إلى طرف',
          description: 'كل رسالة مشفرة باستخدام AES-256-GCM مع مفاتيح ECDH فريدة. حتى نحن لا نستطيع قراءة رسائلك.',
          badge: 'AES-256',
        },
        {
          icon: <KeyRound className="h-5 w-5 text-primary" />,
          title: 'مفاتيح تشفير خاصة بك',
          description: 'يتم إنشاء زوج مفاتيح ECDH (P-256) فريد لكل مستخدم. المفتاح الخاص لا يغادر جهازك أبداً.',
        },
        {
          icon: <EyeOff className="h-5 w-5 text-primary" />,
          title: 'بدون تتبع أو إعلانات',
          description: 'لا نتتبع نشاطك، لا نبيع بياناتك، ولا نعرض إعلانات. خصوصيتك ليست منتجاً.',
          badge: 'ZERO ADS',
        },
        {
          icon: <Globe className="h-5 w-5 text-primary" />,
          title: 'متوافق مع GDPR',
          description: 'نلتزم بأعلى معايير حماية البيانات الأوروبية والدولية لضمان حقوقك الكاملة.',
          badge: 'GDPR',
        },
        {
          icon: <Server className="h-5 w-5 text-primary" />,
          title: 'بنية تحتية آمنة',
          description: 'بيانات مشفرة أثناء النقل عبر TLS 1.3 وأثناء التخزين. سياسات أمان صارمة على مستوى قاعدة البيانات (RLS).',
        },
        {
          icon: <Fingerprint className="h-5 w-5 text-primary" />,
          title: 'مصادقة متعددة الطبقات',
          description: 'تسجيل دخول آمن مع التحقق من البريد الإلكتروني وحماية ضد الحسابات المزيفة.',
        },
        {
          icon: <Database className="h-5 w-5 text-primary" />,
          title: 'حذف البيانات بالكامل',
          description: 'يمكنك حذف حسابك وجميع بياناتك بشكل نهائي في أي وقت. لا نحتفظ بأي شيء.',
        },
        {
          icon: <Ban className="h-5 w-5 text-primary" />,
          title: 'حماية من الرسائل المزعجة',
          description: 'نظام حدود ذكي لكل صندوق يمنع الفيضان ويحمي تركيزك.',
        },
      ],
      comparison: 'كيف يقارن Directly؟',
    },
    en: {
      title: 'Security & Privacy',
      subtitle: 'Built from the ground up to protect your privacy',
      heroText: 'Your messages are end-to-end encrypted. We can\'t read them, we don\'t store them, and we never sell them. Only you hold the keys to your conversations.',
      sections: [
        {
          icon: <Lock className="h-5 w-5 text-primary" />,
          title: 'End-to-End Encryption',
          description: 'Every message is encrypted using AES-256-GCM with unique ECDH keys. Even we cannot read your messages.',
          badge: 'AES-256',
        },
        {
          icon: <KeyRound className="h-5 w-5 text-primary" />,
          title: 'Your Keys, Your Device',
          description: 'A unique ECDH (P-256) key pair is generated for each user. Your private key never leaves your device.',
        },
        {
          icon: <EyeOff className="h-5 w-5 text-primary" />,
          title: 'No Tracking · No Ads',
          description: 'We don\'t track your activity, sell your data, or show ads. Your privacy is not a product.',
          badge: 'ZERO ADS',
        },
        {
          icon: <Globe className="h-5 w-5 text-primary" />,
          title: 'GDPR Compliant',
          description: 'We comply with the highest European and international data protection standards to ensure your full rights.',
          badge: 'GDPR',
        },
        {
          icon: <Server className="h-5 w-5 text-primary" />,
          title: 'Secure Infrastructure',
          description: 'Data encrypted in transit via TLS 1.3 and at rest. Strict Row Level Security (RLS) policies on every table.',
        },
        {
          icon: <Fingerprint className="h-5 w-5 text-primary" />,
          title: 'Multi-Layer Authentication',
          description: 'Secure sign-in with email verification and protection against fake accounts.',
        },
        {
          icon: <Database className="h-5 w-5 text-primary" />,
          title: 'Full Data Deletion',
          description: 'Delete your account and all data permanently at any time. We retain nothing.',
        },
        {
          icon: <Ban className="h-5 w-5 text-primary" />,
          title: 'Spam Protection',
          description: 'Smart per-inbox limits prevent flooding and protect your focus.',
        },
      ],
      comparison: 'How does Directly compare?',
    },
  };

  const c = isRTL ? content.ar : content.en;

  const comparisonFeatures = [
    { feature: isRTL ? 'تشفير E2E' : 'E2E Encryption', directly: true, whatsapp: true, telegram: '⚡', signal: true },
    { feature: isRTL ? 'بدون إعلانات' : 'No Ads', directly: true, whatsapp: false, telegram: true, signal: true },
    { feature: isRTL ? 'تحكم بالوصول' : 'Access Control', directly: true, whatsapp: false, telegram: false, signal: false },
    { feature: isRTL ? 'صناديق مصنفة' : 'Sorted Inboxes', directly: true, whatsapp: false, telegram: false, signal: false },
    { feature: isRTL ? 'حذف كامل للبيانات' : 'Full Data Delete', directly: true, whatsapp: false, telegram: true, signal: true },
    { feature: isRTL ? 'متوافق GDPR' : 'GDPR Compliant', directly: true, whatsapp: true, telegram: false, signal: true },
  ];

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
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

      <main className="max-w-2xl mx-auto pt-20 pb-24 px-4">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="text-center mb-10"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
            <ShieldCheck className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold mb-3">{c.subtitle}</h2>
          <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">{c.heroText}</p>
        </motion.div>

        {/* Security Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
          {c.sections.map((section, i) => (
            <SecurityCard
              key={i}
              icon={section.icon}
              title={section.title}
              description={section.description}
              badge={section.badge}
              delay={i * 0.06}
            />
          ))}
        </div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5, ease }}
          className="rounded-2xl border border-border bg-card p-5"
        >
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
                    <td className="py-2.5 text-center">
                      {row.directly ? <span className="text-emerald-600">✓</span> : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="py-2.5 text-center">
                      {row.whatsapp === true ? <span className="text-emerald-600">✓</span> : row.whatsapp === false ? <span className="text-muted-foreground">—</span> : row.whatsapp}
                    </td>
                    <td className="py-2.5 text-center">
                      {row.telegram === true ? <span className="text-emerald-600">✓</span> : row.telegram === false ? <span className="text-muted-foreground">—</span> : row.telegram}
                    </td>
                    <td className="py-2.5 text-center">
                      {row.signal === true ? <span className="text-emerald-600">✓</span> : row.signal === false ? <span className="text-muted-foreground">—</span> : row.signal}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Bottom Trust Note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center text-xs text-muted-foreground mt-8 leading-relaxed"
        >
          {isRTL 
            ? 'Directly مبني على بنية تحتية مفتوحة المصدر مع التزام كامل بمعايير الأمان العالمية.'
            : 'Directly is built on open-source infrastructure with full commitment to global security standards.'}
        </motion.p>
      </main>

      <BottomNavigation />
    </div>
  );
}
