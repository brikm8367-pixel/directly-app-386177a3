import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sparkles, Users, Briefcase, Heart } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

interface OnboardingFlowProps {
  onComplete: () => void;
}

const COPY: Record<string, any> = {
  ar: {
    s0Title: 'رسائلك ستصل لمكانها الصحيح — تلقائياً.',
    s1Title: 'من هم أهم 3 أشخاص في حياتك؟',
    s1Sub: 'رسائلهم ستصلك دائماً أولاً.',
    s2Title: 'ثلاث مساحات. أنت واحد.',
    s2Sub: '✨ AI سيتولى الباقي.',
    s3Title: 'هادئ الآن. وجاهز لما يأتي.',
    s3Sub: 'ادعُ أول شخص — وشاهد كيف يفهمه Directly.',
    cards: [
      { icon: Heart,     label: 'الخاص',    desc: 'لمن تختاره أنت.',     color: 'text-amber-500',  bg: 'bg-amber-500/10' },
      { icon: Briefcase, label: 'العمل',    desc: 'لمن يأتي بجدية.',     color: 'text-blue-500',   bg: 'bg-blue-500/10' },
      { icon: Users,     label: 'العلاقات', desc: 'للبقية.',             color: 'text-violet-500', bg: 'bg-violet-500/10' },
    ],
    start: 'ابدأ', next: 'التالي', getStarted: 'لنبدأ', skip: 'تخطّى',
  },
  en: {
    s0Title: 'Your messages will always land where they belong — automatically.',
    s1Title: 'Who are the 3 most important people in your life?',
    s1Sub: 'Their messages will always reach you first.',
    s2Title: 'Three spaces. One you.',
    s2Sub: '✨ AI handles the rest.',
    s3Title: 'Quiet now. Ready for what comes.',
    s3Sub: 'Invite your first person — and watch how Directly understands.',
    cards: [
      { icon: Heart,     label: 'Private',       desc: 'For the ones you choose.',     color: 'text-amber-500',  bg: 'bg-amber-500/10' },
      { icon: Briefcase, label: 'Work',          desc: 'For those who come with purpose.', color: 'text-blue-500',   bg: 'bg-blue-500/10' },
      { icon: Users,     label: 'Relationships', desc: 'For everyone else.',           color: 'text-violet-500', bg: 'bg-violet-500/10' },
    ],
    start: 'Start', next: 'Next', getStarted: 'Get Started', skip: 'Skip',
  },
  fr: {
    s0Title: 'Vos messages arrivent toujours à leur place — automatiquement.',
    s1Title: 'Qui sont les 3 personnes les plus importantes pour vous?',
    s1Sub: 'Leurs messages vous parviendront toujours en premier.',
    s2Title: 'Trois espaces. Un seul vous.',
    s2Sub: '✨ L\'IA s\'occupe du reste.',
    s3Title: 'Calme maintenant. Prêt pour ce qui vient.',
    s3Sub: 'Invitez votre première personne — voyez comment Directly comprend.',
    cards: [
      { icon: Heart,     label: 'Privé',     desc: 'Pour ceux que vous choisissez.',  color: 'text-amber-500',  bg: 'bg-amber-500/10' },
      { icon: Briefcase, label: 'Travail',   desc: 'Pour ceux qui viennent avec intention.', color: 'text-blue-500',   bg: 'bg-blue-500/10' },
      { icon: Users,     label: 'Relations', desc: 'Pour tous les autres.',           color: 'text-violet-500', bg: 'bg-violet-500/10' },
    ],
    start: 'Commencer', next: 'Suivant', getStarted: 'C\'est parti', skip: 'Passer',
  },
  es: {
    s0Title: 'Tus mensajes siempre llegarán a su lugar — automáticamente.',
    s1Title: '¿Quiénes son las 3 personas más importantes en tu vida?',
    s1Sub: 'Sus mensajes te llegarán siempre primero.',
    s2Title: 'Tres espacios. Un tú.',
    s2Sub: '✨ La IA se encarga del resto.',
    s3Title: 'Tranquilo ahora. Listo para lo que viene.',
    s3Sub: 'Invita a tu primera persona — y mira cómo Directly entiende.',
    cards: [
      { icon: Heart,     label: 'Privado',     desc: 'Para quienes elijas.',           color: 'text-amber-500',  bg: 'bg-amber-500/10' },
      { icon: Briefcase, label: 'Trabajo',     desc: 'Para quienes vienen con propósito.', color: 'text-blue-500',   bg: 'bg-blue-500/10' },
      { icon: Users,     label: 'Relaciones',  desc: 'Para todos los demás.',          color: 'text-violet-500', bg: 'bg-violet-500/10' },
    ],
    start: 'Empezar', next: 'Siguiente', getStarted: 'Comenzar', skip: 'Saltar',
  },
};

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const { language, isRTL } = useLanguage();
  const t = COPY[language] || COPY.en;

  const finish = () => {
    localStorage.setItem('directly_onboarded', 'true');
    onComplete();
  };

  const next = () => {
    if (step < 3) setStep(step + 1);
    else finish();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      dir={isRTL ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-[90] bg-background flex flex-col items-center justify-center px-8"
    >
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="s0" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.4 }} className="flex flex-col items-center text-center max-w-sm">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-8">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-4 text-foreground leading-tight">
              {t.s0Title}
            </h1>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.4 }} className="flex flex-col items-center text-center max-w-sm">
            <div className="w-20 h-20 rounded-3xl bg-amber-500/10 flex items-center justify-center mb-8">
              <Heart className="h-10 w-10 text-amber-500" />
            </div>
            <h1 className="text-2xl font-bold mb-3 text-foreground">{t.s1Title}</h1>
            <p className="text-base text-muted-foreground leading-relaxed">{t.s1Sub}</p>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.4 }} className="flex flex-col items-center text-center max-w-sm space-y-4">
            <h1 className="text-xl font-bold text-foreground mb-2">{t.s2Title}</h1>
            <div className="w-full space-y-3">
              {t.cards.map((item: any) => (
                <div key={item.label} className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border">
                  <div className={`p-2.5 rounded-xl ${item.bg}`}>
                    <item.icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <div className="text-start">
                    <p className="font-semibold text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-primary font-medium">{t.s2Sub}</p>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="s3" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.4 }} className="flex flex-col items-center text-center max-w-sm">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-8">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-3 text-foreground">{t.s3Title}</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">{t.s3Sub}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-12 w-full max-w-sm px-8 space-y-6">
        <div className="flex justify-center gap-2">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-primary' : 'w-2 bg-muted-foreground/20'}`} />
          ))}
        </div>
        <Button onClick={next} className="w-full h-14 text-lg rounded-2xl touch-feedback font-semibold">
          {step === 0 ? t.start : step === 3 ? t.getStarted : t.next}
        </Button>
        {step < 3 && (
          <button onClick={finish} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
            {t.skip}
          </button>
        )}
      </div>
    </motion.div>
  );
}
