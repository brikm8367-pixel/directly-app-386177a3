import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Mail, Send, Clock, Heart, Briefcase, Users, Sparkles, Brain, Loader2, Share2, Award, BarChart3, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMood, moodConfigs } from '@/hooks/useMood';
import { cn } from '@/lib/utils';
import { shareCardAsImage } from '@/utils/shareCard';

interface Message {
  id: string;
  category: 'work' | 'audience' | 'direct';
  created_at: string;
  sender_id: string;
  receiver_id: string;
}

interface PersonalityAnalysis {
  type: string;
  description: string;
  traits: string[];
  advice: string;
  insight?: string;
  main_sentence?: string;
  inner_sentence?: string;
  badge?: string;
  percentile?: string;
}

function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split('T')[0];
}

const L: Record<string, Record<string, string>> = {
  ar: {
    yourMode: 'نمطك الحالي', yourPattern: 'نمط تواصلك', received: 'مستلمة', sent: 'مرسلة',
    peak: 'الذروة', distribution: 'التوزيع', private: 'الخاص', work: 'العمل',
    audience: 'العلاقات', discoverPattern: 'اكتشف نمطك', whatDoesYourComm: 'ماذا يقول تواصلك عن شخصيتك؟',
    discovering: 'اكتشاف نمطك...', discoverBtn: 'اكتشف نمطك', newAnalysis: '🔄 تحليل جديد',
    analysisFailed: 'تعذر التحليل', shareCard: 'شارك بطاقتك',
    nextReport: 'التقرير القادم خلال', days: 'أيام',
  },
  en: {
    yourMode: 'Your Mode', yourPattern: 'Your Pattern', received: 'Received', sent: 'Sent',
    peak: 'Peak', distribution: 'Distribution', private: 'Private', work: 'Work',
    audience: 'Audience', discoverPattern: 'Discover Your Pattern', whatDoesYourComm: 'What does your communication say about you?',
    discovering: 'Discovering your pattern...', discoverBtn: 'Discover Your Pattern', newAnalysis: '🔄 New Analysis',
    analysisFailed: 'Analysis failed', shareCard: 'Share Your Card',
    nextReport: 'Next report in', days: 'days',
  },
  fr: {
    yourMode: 'Votre mode', yourPattern: 'Votre schéma', received: 'Reçus', sent: 'Envoyés',
    peak: 'Pic', distribution: 'Répartition', private: 'Privé', work: 'Travail',
    audience: 'Public', discoverPattern: 'Découvrez votre schéma', whatDoesYourComm: 'Que dit votre communication sur vous ?',
    discovering: 'Découverte en cours...', discoverBtn: 'Découvrez votre schéma', newAnalysis: '🔄 Nouvelle analyse',
    analysisFailed: 'Analyse échouée', shareCard: 'Partagez votre carte',
    nextReport: 'Prochain rapport dans', days: 'jours',
  },
  es: {
    yourMode: 'Tu modo', yourPattern: 'Tu patrón', received: 'Recibidos', sent: 'Enviados',
    peak: 'Pico', distribution: 'Distribución', private: 'Privado', work: 'Trabajo',
    audience: 'Audiencia', discoverPattern: 'Descubre tu patrón', whatDoesYourComm: '¿Qué dice tu comunicación sobre ti?',
    discovering: 'Descubriendo tu patrón...', discoverBtn: 'Descubre tu patrón', newAnalysis: '🔄 Nuevo análisis',
    analysisFailed: 'Análisis fallido', shareCard: 'Comparte tu tarjeta',
    nextReport: 'Próximo informe en', days: 'días',
  },
};

export default function CommunicationPatterns({ userId }: { userId: string }) {
  const { isRTL, language } = useLanguage();
  const { mood, setMood } = useMood();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<PersonalityAnalysis | null>(null);
  const l = L[language] || L.en;

  const lastWeekStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return getWeekStart(d);
  }, []);

  useEffect(() => {
    const loadCachedAnalysis = async () => {
      const { data } = await supabase
        .from('weekly_analysis')
        .select('analysis')
        .eq('user_id', userId)
        .eq('week_start', lastWeekStart)
        .single();
      if (data?.analysis) {
        setAnalysis(data.analysis as unknown as PersonalityAnalysis);
      }
    };
    if (userId) loadCachedAnalysis();
  }, [userId, lastWeekStart]);

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      const weekStart = new Date(lastWeekStart);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const [{ data: recv }, { data: sent }] = await Promise.all([
        supabase.from('messages').select('id, category, created_at, sender_id, receiver_id').eq('receiver_id', userId).gte('created_at', weekStart.toISOString()).lt('created_at', weekEnd.toISOString()),
        supabase.from('messages').select('id, category, created_at, sender_id, receiver_id').eq('sender_id', userId).gte('created_at', weekStart.toISOString()).lt('created_at', weekEnd.toISOString()),
      ]);
      setMessages([...(recv || []), ...(sent || [])] as Message[]);
      setIsLoading(false);
    };
    if (userId) fetch();
  }, [userId, lastWeekStart]);

  const stats = useMemo(() => {
    const recv = messages.filter(m => m.receiver_id === userId);
    const sent = messages.filter(m => m.sender_id === userId);
    const byCategory = {
      work: recv.filter(m => m.category === 'work').length,
      audience: recv.filter(m => m.category === 'audience').length,
      direct: recv.filter(m => m.category === 'direct').length,
    };
    const hours: Record<number, number> = {};
    recv.forEach(m => { const h = new Date(m.created_at).getHours(); hours[h] = (hours[h] || 0) + 1; });
    const peakHour = Object.entries(hours).sort((a, b) => b[1] - a[1])[0]?.[0] || '12';
    const total = recv.length || 1;

    return {
      received: recv.length, sent: sent.length, byCategory, peakHour: parseInt(peakHour),
      workPct: Math.round((byCategory.work / total) * 100),
      audiencePct: Math.round((byCategory.audience / total) * 100),
      directPct: Math.round((byCategory.direct / total) * 100),
      responseRate: recv.length > 0 ? Math.round(sent.length / recv.length * 100) : 0,
    };
  }, [messages, userId]);

  const analyzePersonality = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-personality', {
        body: {
          stats: {
            totalReceived: stats.received, totalSent: stats.sent,
            workCount: stats.byCategory.work, audienceCount: stats.byCategory.audience, directCount: stats.byCategory.direct,
            workRatio: stats.workPct, audienceRatio: stats.audiencePct, directRatio: stats.directPct,
            responseRate: stats.responseRate,
            mostActiveHour: stats.peakHour, period: 'week',
          },
          language,
        },
      });
      if (error) throw error;
      if (data?.type) {
        const analysisData = data as PersonalityAnalysis;
        setAnalysis(analysisData);
        await supabase.from('weekly_analysis').upsert({
          user_id: userId,
          week_start: lastWeekStart,
          analysis: analysisData as any,
        }, { onConflict: 'user_id,week_start' });
      } else {
        toast.error(l.analysisFailed);
      }
    } catch {
      toast.error(l.analysisFailed);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleShareCard = () => {
    shareCardAsImage(
      'pattern-vip-card',
      'My Communication Pattern — Directly',
      analysis?.type ? `I'm a "${analysis.type}" communicator ✨` : 'Check out my pattern on Directly!'
    );
  };

  const fmtHour = (h: number) => isRTL
    ? (h < 12 ? `${h || 12} ص` : `${h - 12 || 12} م`)
    : (h < 12 ? `${h || 12} AM` : `${h - 12 || 12} PM`);

  const weekLabel = useMemo(() => {
    const start = new Date(lastWeekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const fmt = new Intl.DateTimeFormat(language === 'ar' ? 'ar' : language, { month: 'short', day: 'numeric' });
    return `${fmt.format(start)} – ${fmt.format(end)}`;
  }, [lastWeekStart, language]);

  // Days until next report
  const daysUntilNext = useMemo(() => {
    const nextWeekStart = new Date(lastWeekStart);
    nextWeekStart.setDate(nextWeekStart.getDate() + 14);
    const diff = Math.ceil((nextWeekStart.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }, [lastWeekStart]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="relative">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
          <Crown className="h-5 w-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Mood Selector */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-muted-foreground">{l.yourMode}</h3>
        <div className="grid grid-cols-4 gap-2">
          {moodConfigs.map((m) => (
            <button
              key={m.id}
              onClick={() => setMood(m.id)}
              className={cn(
                'flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all touch-feedback border',
                mood === m.id
                  ? 'bg-primary/10 border-primary/30 text-foreground'
                  : 'bg-card border-border text-muted-foreground'
              )}
            >
              <span className="text-2xl">{m.emoji}</span>
              <span className="text-xs font-semibold">{m.label[language] || m.label.en}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Crown className="h-5 w-5 text-primary" />
          </div>
          <h2 className="font-bold text-lg">{l.yourPattern}</h2>
        </div>
        <span className="text-xs text-muted-foreground font-medium">{weekLabel}</span>
      </div>

      {/* AI Personality — 8-step psychological order */}
      {analysis ? (
        <div className="space-y-4 animate-fade-in-up">
          {/* §1 — Identity: Pattern Name + Emoji */}
          <div id="pattern-vip-card" className="relative overflow-hidden rounded-2xl p-6 text-center" style={{ background: 'linear-gradient(135deg, hsl(220 15% 10%), hsl(220 20% 16%))' }}>
            <div className="absolute inset-0 opacity-10" style={{ background: 'radial-gradient(circle at 30% 20%, hsl(45 80% 60%), transparent 60%)' }} />
            <div className="relative z-10">
              <p className="text-3xl font-bold text-white mb-2">{analysis.type}</p>
              <p className="text-sm text-white/70 mb-4">{analysis.description}</p>

              {/* §2 — Three Traits */}
              <div className="flex flex-wrap gap-2 justify-center mb-4">
                {analysis.traits.map((t, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold text-xs border border-amber-500/30">
                    {t}
                  </span>
                ))}
              </div>

              {/* §3 — Numbers */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-white/5 rounded-xl p-2.5 backdrop-blur-sm">
                  <p className="text-lg font-bold text-white">{stats.responseRate}%</p>
                  <p className="text-[10px] text-white/50">{isRTL ? 'معدل الرد' : 'Reply rate'}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-2.5 backdrop-blur-sm">
                  <p className="text-lg font-bold text-white">{fmtHour(stats.peakHour)}</p>
                  <p className="text-[10px] text-white/50">{isRTL ? 'وقت الذروة' : 'Peak time'}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-2.5 backdrop-blur-sm">
                  <p className="text-lg font-bold text-white">{stats.sent}</p>
                  <p className="text-[10px] text-white/50">{isRTL ? 'محادثات' : 'Conversations'}</p>
                </div>
              </div>

              {/* §4 — Social Comparison */}
              {analysis.percentile && (
                <div className="bg-white/5 rounded-xl p-3 mb-4 backdrop-blur-sm border border-white/10">
                  <div className="flex items-center justify-center gap-2">
                    <BarChart3 className="h-4 w-4 text-amber-400" />
                    <p className="text-xs text-white/80 font-medium">{analysis.percentile}</p>
                  </div>
                </div>
              )}

              {/* §5 — Personal Analysis */}
              {analysis.main_sentence && (
                <p className="text-sm text-white/80 italic mb-2">"{analysis.main_sentence}"</p>
              )}
              {analysis.inner_sentence && (
                <p className="text-xs text-amber-300/70 mb-4">{analysis.inner_sentence}</p>
              )}

              {/* §6 — Badge */}
              {analysis.badge && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 mb-4">
                  <Award className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-xs font-semibold text-amber-300">{analysis.badge}</span>
                </div>
              )}

              <p className="text-[10px] text-white/30 mt-3">Directly — Smart Communication</p>
            </div>
          </div>

          {/* §7 — Share Button */}
          <Button onClick={handleShareCard} className="w-full h-13 text-base font-semibold rounded-2xl gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border-0">
            <Share2 className="h-5 w-5" />
            {l.shareCard}
          </Button>

          {/* Tips */}
          {analysis.advice && (
            <Card className="p-4 border-primary/10">
              <p className="text-sm text-muted-foreground italic">💡 {analysis.advice}</p>
            </Card>
          )}
          {analysis.insight && (
            <Card className="p-4 border-primary/10">
              <p className="text-xs text-muted-foreground">🧠 {analysis.insight}</p>
            </Card>
          )}

          {/* §8 — Next Report Date */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>{l.nextReport} {daysUntilNext} {l.days}</span>
          </div>

          <Button variant="ghost" onClick={() => { setAnalysis(null); analyzePersonality(); }} className="w-full text-sm text-muted-foreground">
            {l.newAnalysis}
          </Button>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Mail, label: l.received, value: stats.received },
              { icon: Send, label: l.sent, value: stats.sent },
              { icon: Clock, label: l.peak, value: fmtHour(stats.peakHour) },
            ].map((item, i) => (
              <Card key={i} className="p-3 border-primary/10">
                <div className="flex items-center gap-1.5 mb-1">
                  <item.icon className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                </div>
                <p className={cn('font-bold', typeof item.value === 'number' ? 'text-2xl' : 'text-sm')}>{item.value}</p>
              </Card>
            ))}
          </div>

          {/* Distribution */}
          <Card className="p-4 border-primary/10">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              {l.distribution}
            </h3>
            <div className="space-y-3">
              {[
                { icon: Heart, label: l.private, pct: stats.directPct, color: 'bg-[hsl(var(--others))]' },
                { icon: Briefcase, label: l.work, pct: stats.workPct, color: 'bg-[hsl(var(--work))]' },
                { icon: Users, label: l.audience, pct: stats.audiencePct, color: 'bg-[hsl(var(--audience))]' },
              ].map((item, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm">{item.label}</span>
                    </div>
                    <span className="text-sm font-bold">{item.pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className={cn('h-full rounded-full transition-all duration-700', item.color)} style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Discover CTA */}
          <Card className="border-primary/15 overflow-hidden" style={{ background: 'var(--gradient-gold-soft)' }}>
            <CardContent className="p-5 text-center">
              <Brain className="h-10 w-10 text-primary mx-auto mb-3 animate-crown" />
              <p className="text-lg font-bold mb-1">{l.discoverPattern}</p>
              <p className="text-sm text-muted-foreground mb-5">{l.whatDoesYourComm}</p>
              <Button
                onClick={analyzePersonality}
                disabled={isAnalyzing}
                size="lg"
                className="h-13 px-8 text-base rounded-2xl touch-feedback"
              >
                {isAnalyzing ? (
                  <><Loader2 className="h-5 w-5 animate-spin me-2" />{l.discovering}</>
                ) : (
                  <><Sparkles className="h-5 w-5 me-2" />{l.discoverBtn}</>
                )}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
