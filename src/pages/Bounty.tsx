import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Bug, Mail, Award, CheckCircle2, AlertTriangle } from 'lucide-react';

const COPY: Record<string, any> = {
  ar: {
    title: 'برنامج Bug Bounty',
    subtitle: 'أمنك أولويتنا. مكافآت لمن يساعدنا في الحفاظ على Directly آمناً.',
    intro: 'نحن نؤمن بالشفافية والأمان. إذا اكتشفت ثغرة أمنية، أبلغنا — وسنكافئك.',
    scopeTitle: 'النطاق',
    scope: ['تطبيق الويب: directly-app.lovable.app', 'API & Edge Functions', 'تطبيقات iOS و Android'],
    rewardsTitle: 'المكافآت',
    rewards: [
      { sev: 'حرجة', desc: 'تنفيذ كود عن بُعد، تجاوز التشفير E2E، الوصول لبيانات مستخدمين آخرين', amount: '$2,000 – $10,000' },
      { sev: 'عالية', desc: 'تجاوز المصادقة، XSS مستمر، رفع امتيازات', amount: '$500 – $2,000' },
      { sev: 'متوسطة', desc: 'CSRF، IDOR، تسريب معلومات', amount: '$100 – $500' },
      { sev: 'منخفضة', desc: 'أخطاء أمنية ثانوية', amount: '$25 – $100' },
    ],
    rulesTitle: 'القواعد',
    rules: [
      'لا تنفذ هجمات DOS أو spam',
      'لا تستخدم بيانات مستخدمين حقيقيين — استخدم حسابك فقط',
      'أبلغنا قبل النشر العام (90 يوماً)',
      'احترم الخصوصية — لا تخزن بيانات حساسة',
    ],
    reportTitle: 'كيف تبلّغ',
    reportBody: 'أرسل تقريراً مفصلاً يتضمن خطوات إعادة الإنتاج، السيناريو، والأثر الأمني.',
    email: 'security@directly.app',
    encrypted: 'مشفّر — البيانات بأمان',
    back: 'العودة',
  },
  en: {
    title: 'Bug Bounty Program',
    subtitle: 'Your security is our priority. Rewards for those who help keep Directly safe.',
    intro: 'We believe in transparency and security. Found a vulnerability? Report it — and get rewarded.',
    scopeTitle: 'Scope',
    scope: ['Web app: directly-app.lovable.app', 'API & Edge Functions', 'iOS and Android apps'],
    rewardsTitle: 'Rewards',
    rewards: [
      { sev: 'Critical', desc: 'RCE, E2E bypass, access to other users\' data', amount: '$2,000 – $10,000' },
      { sev: 'High',     desc: 'Auth bypass, stored XSS, privilege escalation', amount: '$500 – $2,000' },
      { sev: 'Medium',   desc: 'CSRF, IDOR, info disclosure', amount: '$100 – $500' },
      { sev: 'Low',      desc: 'Minor security issues', amount: '$25 – $100' },
    ],
    rulesTitle: 'Rules',
    rules: [
      'No DOS attacks or spam',
      'Don\'t use real user data — use your own account',
      'Notify us before public disclosure (90 days)',
      'Respect privacy — don\'t store sensitive data',
    ],
    reportTitle: 'How to Report',
    reportBody: 'Send a detailed report with reproduction steps, scenario, and security impact.',
    email: 'security@directly.app',
    encrypted: 'Encrypted — your data is safe',
    back: 'Back',
  },
  fr: {
    title: 'Programme Bug Bounty',
    subtitle: 'Votre sécurité est notre priorité. Récompenses pour ceux qui nous aident à protéger Directly.',
    intro: 'Nous croyons en la transparence. Vous avez trouvé une vulnérabilité? Signalez-la et soyez récompensé.',
    scopeTitle: 'Portée',
    scope: ['App web: directly-app.lovable.app', 'API & Edge Functions', 'Apps iOS et Android'],
    rewardsTitle: 'Récompenses',
    rewards: [
      { sev: 'Critique', desc: 'RCE, contournement E2E, accès aux données d\'autres utilisateurs', amount: '$2,000 – $10,000' },
      { sev: 'Élevée', desc: 'Contournement d\'auth, XSS stocké, élévation de privilèges', amount: '$500 – $2,000' },
      { sev: 'Moyenne', desc: 'CSRF, IDOR, divulgation d\'informations', amount: '$100 – $500' },
      { sev: 'Faible', desc: 'Problèmes de sécurité mineurs', amount: '$25 – $100' },
    ],
    rulesTitle: 'Règles',
    rules: [
      'Pas d\'attaques DOS ou spam',
      'N\'utilisez pas de données réelles — utilisez votre propre compte',
      'Avertissez-nous avant la divulgation publique (90 jours)',
      'Respectez la vie privée — ne stockez pas de données sensibles',
    ],
    reportTitle: 'Comment signaler',
    reportBody: 'Envoyez un rapport détaillé avec étapes de reproduction, scénario, et impact.',
    email: 'security@directly.app',
    encrypted: 'Chiffré — vos données sont en sécurité',
    back: 'Retour',
  },
  es: {
    title: 'Programa Bug Bounty',
    subtitle: 'Tu seguridad es nuestra prioridad. Recompensas para quienes nos ayudan a mantener Directly seguro.',
    intro: 'Creemos en la transparencia. ¿Encontraste una vulnerabilidad? Repórtala y recibe una recompensa.',
    scopeTitle: 'Alcance',
    scope: ['App web: directly-app.lovable.app', 'API y Edge Functions', 'Apps iOS y Android'],
    rewardsTitle: 'Recompensas',
    rewards: [
      { sev: 'Crítica', desc: 'RCE, bypass E2E, acceso a datos de otros usuarios', amount: '$2,000 – $10,000' },
      { sev: 'Alta', desc: 'Bypass de auth, XSS persistente, escalada de privilegios', amount: '$500 – $2,000' },
      { sev: 'Media', desc: 'CSRF, IDOR, divulgación de información', amount: '$100 – $500' },
      { sev: 'Baja', desc: 'Problemas de seguridad menores', amount: '$25 – $100' },
    ],
    rulesTitle: 'Reglas',
    rules: [
      'Sin ataques DOS o spam',
      'No uses datos reales — usa tu propia cuenta',
      'Notifícanos antes de divulgar públicamente (90 días)',
      'Respeta la privacidad — no almacenes datos sensibles',
    ],
    reportTitle: 'Cómo reportar',
    reportBody: 'Envía un informe detallado con pasos de reproducción, escenario e impacto.',
    email: 'security@directly.app',
    encrypted: 'Cifrado — tus datos están seguros',
    back: 'Volver',
  },
};

export default function Bounty() {
  const { language, isRTL } = useLanguage();
  const navigate = useNavigate();
  const t = COPY[language] || COPY.en;

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate('/security')} className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" />
          {t.back}
        </Button>

        <div className="text-center mb-10">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl mb-4" style={{ background: 'linear-gradient(135deg, #D4AF37, #B8860B)' }}>
            <Bug className="h-8 w-8 text-black" />
          </div>
          <h1 className="text-3xl font-bold mb-2">{t.title}</h1>
          <p className="text-muted-foreground">{t.subtitle}</p>
        </div>

        <p className="text-base mb-8 leading-relaxed">{t.intro}</p>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {t.scopeTitle}
          </h2>
          <ul className="space-y-2">
            {t.scope.map((item: string, i: number) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            {t.rewardsTitle}
          </h2>
          <div className="space-y-3">
            {t.rewards.map((r: any, i: number) => (
              <div key={i} className="rounded-2xl border border-border p-4 bg-card">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-base">{r.sev}</span>
                  <span className="font-mono text-sm text-primary">{r.amount}</span>
                </div>
                <p className="text-sm text-muted-foreground">{r.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
            {t.rulesTitle}
          </h2>
          <ul className="space-y-2">
            {t.rules.map((r: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-primary mt-0.5">•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-primary/20 p-6 bg-primary/5">
          <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            {t.reportTitle}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">{t.reportBody}</p>
          <a href={`mailto:${t.email}`} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity">
            <Mail className="h-4 w-4" />
            {t.email}
          </a>
          <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
            <Shield className="h-3 w-3 text-emerald-500" />
            {t.encrypted}
          </p>
        </section>

        <p className="text-center text-xs text-muted-foreground mt-10">
          Directly — Smart Communication
        </p>
      </div>
    </div>
  );
}
