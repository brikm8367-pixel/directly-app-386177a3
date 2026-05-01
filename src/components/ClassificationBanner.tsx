import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/i18n/LanguageContext';

interface ClassificationBannerProps {
  senderName: string;
  category: 'work' | 'audience' | 'direct';
  isFirst?: boolean;
  isContextChange?: boolean;
}

const COPY: Record<string, Record<string, (name: string, cat: string) => string>> = {
  ar: {
    first: () => 'أول رسالة وصلت لمكانها — هذا هو Directly.',
    normal: (name, cat) => `رسالة من ${name} — فهمناها ووصلت لمكانها في ${cat}.`,
    context: (name) => `${name} راسلك بسياق مختلف هذه المرة — وصلت للمكان الصحيح.`,
  },
  en: {
    first: () => 'First message landed in its place — this is Directly.',
    normal: (name, cat) => `Message from ${name} — understood and placed in ${cat}.`,
    context: (name) => `${name} reached out in a different context — placed correctly.`,
  },
  fr: {
    first: () => 'Premier message à sa place — voici Directly.',
    normal: (name, cat) => `Message de ${name} — compris et placé dans ${cat}.`,
    context: (name) => `${name} vous a écrit dans un contexte différent — placé correctement.`,
  },
  es: {
    first: () => 'Primer mensaje en su lugar — esto es Directly.',
    normal: (name, cat) => `Mensaje de ${name} — entendido y colocado en ${cat}.`,
    context: (name) => `${name} te escribió en un contexto diferente — colocado correctamente.`,
  },
};

const CAT_LABELS: Record<string, Record<string, { label: string; emoji: string; cls: string }>> = {
  ar: {
    work:     { label: 'العمل',    emoji: '💼', cls: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
    audience: { label: 'العلاقات', emoji: '👥', cls: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20' },
    direct:   { label: 'الخاص',    emoji: '🤍', cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  },
  en: {
    work:     { label: 'Work',          emoji: '💼', cls: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
    audience: { label: 'Relationships', emoji: '👥', cls: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20' },
    direct:   { label: 'Private',       emoji: '🤍', cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  },
  fr: {
    work:     { label: 'Travail',  emoji: '💼', cls: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
    audience: { label: 'Relations',emoji: '👥', cls: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20' },
    direct:   { label: 'Privé',    emoji: '🤍', cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  },
  es: {
    work:     { label: 'Trabajo',     emoji: '💼', cls: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
    audience: { label: 'Relaciones',  emoji: '👥', cls: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20' },
    direct:   { label: 'Privado',     emoji: '🤍', cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  },
};

export function ClassificationBanner({ senderName, category, isFirst, isContextChange }: ClassificationBannerProps) {
  const { language } = useLanguage();
  const [show, setShow] = useState(true);
  const lang = (COPY[language] ? language : 'en') as keyof typeof COPY;
  const cat = CAT_LABELS[lang][category];

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const copy = COPY[lang];
  const text = isFirst
    ? copy.first(senderName, '')
    : isContextChange
      ? copy.context(senderName, '')
      : copy.normal(senderName, `${cat.label} ${cat.emoji}`);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className={`fixed top-16 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 rounded-full border ${cat.cls} backdrop-blur-sm shadow-lg max-w-[90vw] text-center`}
        >
          <p className="text-sm font-medium">{text}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
