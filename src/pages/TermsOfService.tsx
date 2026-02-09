import { useLanguage } from '@/i18n/LanguageContext';
import { BottomNavigation } from '@/components/BottomNavigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function TermsOfService() {
  const { isRTL } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <header className="fixed top-0 right-0 left-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto flex h-14 items-center gap-3 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-10 w-10 rounded-xl">
            {isRTL ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
          </Button>
          <h1 className="font-bold text-lg">{isRTL ? 'شروط الخدمة' : 'Terms of Service'}</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto pt-16 pb-24 px-4 space-y-6">
        <p className="text-sm text-muted-foreground">{isRTL ? 'آخر تحديث: فبراير 2026' : 'Last updated: February 2026'}</p>

        {(isRTL ? [
          { t: 'قبول الشروط', c: 'باستخدام تطبيق Directly، فإنك توافق على هذه الشروط. إذا لم توافق، يرجى عدم استخدام التطبيق.' },
          { t: 'وصف الخدمة', c: 'Directly هو منصة تواصل ذكية تتيح لك التحكم في من يمكنه الوصول إليك عبر ثلاثة مستويات: الخاص، العمل، والدائرة.' },
          { t: 'حسابك', c: 'أنت مسؤول عن الحفاظ على أمان حسابك وكلمة مرورك. يجب أن تكون المعلومات التي تقدمها دقيقة وحقيقية.' },
          { t: 'السلوك المقبول', c: 'يُحظر: إرسال رسائل مزعجة أو تهديدية، انتحال هوية الآخرين، محاولة اختراق النظام، أو أي استخدام غير قانوني.' },
          { t: 'المحتوى', c: 'أنت مسؤول عن المحتوى الذي ترسله. نحتفظ بالحق في إزالة أي محتوى ينتهك هذه الشروط.' },
          { t: 'الاشتراكات والمدفوعات', c: 'بعض الميزات تتطلب اشتراكاً مدفوعاً. يمكنك إلغاء اشتراكك في أي وقت. المبالغ المدفوعة غير قابلة للاسترداد.' },
          { t: 'إنهاء الحساب', c: 'يمكننا تعليق أو إنهاء حسابك في حالة انتهاك هذه الشروط. يمكنك حذف حسابك في أي وقت.' },
          { t: 'تحديد المسؤولية', c: 'الخدمة مقدمة "كما هي". لا نضمن خلوها من الأخطاء أو الانقطاعات. مسؤوليتنا محدودة وفقاً للقانون المعمول به.' },
          { t: 'القانون المعمول به', c: 'تخضع هذه الشروط للقوانين المعمول بها في بلد إقامتك.' },
        ] : [
          { t: 'Acceptance of Terms', c: 'By using Directly, you agree to these terms. If you do not agree, please do not use the app.' },
          { t: 'Service Description', c: 'Directly is an intelligent communication platform that lets you control who can reach you through three levels: Private, Work, and Audience.' },
          { t: 'Your Account', c: 'You are responsible for maintaining the security of your account and password. Information you provide must be accurate and truthful.' },
          { t: 'Acceptable Conduct', c: 'Prohibited: sending spam or threatening messages, impersonating others, attempting to hack the system, or any illegal use.' },
          { t: 'Content', c: 'You are responsible for content you send. We reserve the right to remove any content that violates these terms.' },
          { t: 'Subscriptions & Payments', c: 'Some features require a paid subscription. You can cancel your subscription at any time. Paid amounts are non-refundable.' },
          { t: 'Account Termination', c: 'We may suspend or terminate your account for violating these terms. You can delete your account at any time.' },
          { t: 'Limitation of Liability', c: 'The service is provided "as is." We do not guarantee it will be error-free or uninterrupted. Our liability is limited as permitted by applicable law.' },
          { t: 'Governing Law', c: 'These terms are governed by the applicable laws of your country of residence.' },
        ]).map((s, i) => (
          <section key={i}>
            <h2 className="text-base font-bold mb-2">{s.t}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{s.c}</p>
          </section>
        ))}
      </main>
      <BottomNavigation />
    </div>
  );
}
