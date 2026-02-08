import { useState, useEffect } from 'react';

export type Mood = 'calm' | 'professional' | 'focus' | 'work';

export interface MoodConfig {
  id: Mood;
  label: { ar: string; en: string };
  description: { ar: string; en: string };
  emoji: string;
}

export const moodConfigs: MoodConfig[] = [
  {
    id: 'calm',
    label: { ar: 'هادئ', en: 'Calm' },
    description: { ar: 'تواصل مريح بدون ضغط', en: 'Relaxed communication' },
    emoji: '🌊',
  },
  {
    id: 'professional',
    label: { ar: 'احترافي', en: 'Professional' },
    description: { ar: 'وضوح وجدية', en: 'Clear and serious' },
    emoji: '💼',
  },
  {
    id: 'focus',
    label: { ar: 'تركيز', en: 'Focus' },
    description: { ar: 'الأهم فقط', en: 'Essentials only' },
    emoji: '🎯',
  },
  {
    id: 'work',
    label: { ar: 'عمل', en: 'Work' },
    description: { ar: 'إنتاجية عالية', en: 'High productivity' },
    emoji: '⚡',
  },
];

export function useMood() {
  const [mood, setMood] = useState<Mood>(() =>
    (localStorage.getItem('directly-mood') as Mood) || 'calm'
  );

  useEffect(() => {
    localStorage.setItem('directly-mood', mood);
    document.documentElement.setAttribute('data-mood', mood);
  }, [mood]);

  return { mood, setMood };
}
