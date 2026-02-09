import { useLanguage } from '@/i18n/LanguageContext';
import { BottomNavigation } from '@/components/BottomNavigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
  const { isRTL } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <header className="fixed top-0 right-0 left-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto flex h-14 items-center gap-3 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-10 w-10 rounded-xl">
            {isRTL ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
          </Button>
          <h1 className="font-bold text-lg">{isRTL ? 'سياسة الخصوصية' : 'Privacy Policy'}</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto pt-16 pb-24 px-4 space-y-6">
        <p className="text-sm text-muted-foreground">{isRTL ? 'آخر تحديث: فبراير 2026' : 'Last updated: February 2026'}</p>

        {(isRTL ? [
          { t: 'مقدمة', c: 'تطبيق Directly يحترم خصوصيتك. نلتزم بحماية بياناتك الشخصية وفقاً لأعلى المعايير الدولية بما في ذلك GDPR و CCPA.' },
          { t: 'البيانات التي نجمعها', c: 'نجمع فقط: البريد الإلكتروني، اسم المستخدم، الاسم الظاهر، صورة الملف الشخصي. لا نجمع بيانات الموقع أو جهات الاتصال أو أي بيانات حساسة أخرى.' },
          { t: 'كيف نستخدم بياناتك', c: 'نستخدم بياناتك فقط لتقديم خدمة التواصل وتحسين تجربتك. لا نبيع أو نشارك بياناتك مع أطراف ثالثة لأغراض إعلانية.' },
          { t: 'تشفير الرسائل', c: 'جميع الرسائل محمية بتشفير TLS أثناء النقل. بياناتك مخزنة بشكل آمن في خوادم محمية.' },
          { t: 'حقوقك', c: 'لديك الحق في: الوصول إلى بياناتك، تعديلها، حذفها، وتصديرها في أي وقت. يمكنك حذف حسابك بالكامل من الإعدادات.' },
          { t: 'ملفات تعريف الارتباط', c: 'نستخدم ملفات تعريف الارتباط الأساسية فقط لتشغيل التطبيق. لا نستخدم ملفات تتبع أو إعلانية.' },
          { t: 'الأطفال', c: 'التطبيق غير مخصص للأطفال دون سن 13 عاماً. لا نجمع بيانات من الأطفال عن علم.' },
          { t: 'التواصل معنا', c: 'لأي استفسارات حول الخصوصية، تواصل معنا عبر: privacy@directly.app' },
        ] : [
          { t: 'Introduction', c: 'Directly respects your privacy. We are committed to protecting your personal data in accordance with the highest international standards including GDPR and CCPA.' },
          { t: 'Data We Collect', c: 'We collect only: email address, username, display name, and profile photo. We do not collect location data, contacts, or other sensitive information.' },
          { t: 'How We Use Your Data', c: 'We use your data solely to provide the communication service and improve your experience. We never sell or share your data with third parties for advertising purposes.' },
          { t: 'Message Encryption', c: 'All messages are protected with TLS encryption in transit. Your data is stored securely on protected servers.' },
          { t: 'Your Rights', c: 'You have the right to: access, modify, delete, and export your data at any time. You can delete your account entirely from Settings.' },
          { t: 'Cookies', c: 'We use only essential cookies to operate the app. We do not use tracking or advertising cookies.' },
          { t: 'Children', c: 'The app is not intended for children under 13. We do not knowingly collect data from children.' },
          { t: 'Contact Us', c: 'For any privacy inquiries, contact us at: privacy@directly.app' },
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
