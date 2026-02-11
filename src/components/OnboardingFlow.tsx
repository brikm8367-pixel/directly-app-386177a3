import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Shield, Layers, Sparkles } from 'lucide-react';

interface OnboardingFlowProps {
  onComplete: () => void;
}

const steps = [
  {
    icon: Shield,
    title: { ar: 'رسائلك، بطريقتك', en: 'Your messages, your way' },
    subtitle: { ar: 'تحكّم كامل في من يصلك، وكيف يصلك', en: 'Full control over who reaches you and how' },
    philosophy: { ar: 'احتمالية ردّ واهتمام أعلى', en: 'Higher chance of real attention & response' },
  },
  {
    icon: Layers,
    title: { ar: 'كل رسائلك في مكان واحد', en: 'All messages in one place' },
    subtitle: { ar: 'خاص · عمل · علاقات — مصنّفة تلقائياً', en: 'Private · Work · Relationships — auto-sorted' },
    philosophy: { ar: 'بالطريقة التي تناسبك أنت', en: 'Organized the way that suits you' },
  },
  {
    icon: Sparkles,
    title: { ar: 'تواصل بوضوح', en: 'Communicate with clarity' },
    subtitle: { ar: 'كل رسالة لها وزن ومعنى', en: 'Every message carries weight and meaning' },
    philosophy: { ar: 'ليس هدوءاً فحسب، بل تواصل أذكى', en: "Not just calm — smarter communication" },
  },
];

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { isRTL } = useLanguage();
  const [step, setStep] = useState(0);
  const lang = isRTL ? 'ar' : 'en';
  const current = steps[step];
  const Icon = current.icon;

  const next = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else {
      localStorage.setItem('directly_onboarded', 'true');
      onComplete();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] bg-background flex flex-col items-center justify-center px-8"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center text-center max-w-sm"
        >
          {/* Icon */}
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-8">
            <Icon className="h-10 w-10 text-primary" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold mb-3 text-foreground">
            {current.title[lang]}
          </h1>

          {/* Subtitle */}
          <p className="text-base text-muted-foreground mb-4 leading-relaxed">
            {current.subtitle[lang]}
          </p>

          {/* Philosophy line */}
          <p className="text-sm text-primary font-medium italic">
            ✨ {current.philosophy[lang]}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Progress & Action */}
      <div className="absolute bottom-12 w-full max-w-sm px-8 space-y-6">
        {/* Dots */}
        <div className="flex justify-center gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step ? 'w-8 bg-primary' : 'w-2 bg-muted-foreground/20'
              }`}
            />
          ))}
        </div>

        <Button
          onClick={next}
          className="w-full h-14 text-lg rounded-2xl touch-feedback font-semibold"
        >
          {step === steps.length - 1
            ? (isRTL ? 'ابدأ الآن' : 'Get Started')
            : (isRTL ? 'التالي' : 'Next')}
        </Button>

        {step < steps.length - 1 && (
          <button
            onClick={() => { localStorage.setItem('directly_onboarded', 'true'); onComplete(); }}
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {isRTL ? 'تخطي' : 'Skip'}
          </button>
        )}
      </div>
    </motion.div>
  );
}
