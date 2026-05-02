import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Crown, Mail, Send, Clock, Heart, Briefcase, Users, Sparkles, Brain, Loader2, Share2, Award, BarChart3, Calendar, Shield, Star } from 'lucide-react';
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
    yourMode: 'حالتك', yourPattern: 'هويتك في التواصل', received: 'مستلمة', sent: 'مرسلة',
    peak: 'الذروة', distribution: 'التوزيع', private: 'الخاص', work: 'العمل',
    audience: 'العلاقات', discoverPattern: 'اكتشف من أنت حقاً', whatDoesYourComm: 'كيف تتواصل يقول الكثير عنك.',
    discovering: 'نقرأ أسلوبك...', discoverBtn: 'اكتشف هويتك', newAnalysis: '🔄 تحليل جديد',
    analysisFailed: 'تعذر التحليل', shareCard: 'شارك هويتك',
    nextReport: 'التقرير القادم خلال', days: 'أيام',
    progressTitle: 'Directly يراقب أسلوبك', progressSubtitle: 'رسالة لفتح تحليلك الأول',
    firstInsight: 'لاحظنا شيئاً عنك',
  },
  en: {
    yourMode: 'Your Mode', yourPattern: 'Your Communication Identity', received: 'Received', sent: 'Sent',
    peak: 'Peak', distribution: 'Distribution', private: 'Private', work: 'Work',
    audience: 'Audience', discoverPattern: 'Discover who you really are', whatDoesYourComm: 'How you communicate says everything about you.',
    discovering: 'Reading your style...', discoverBtn: 'Discover Your Identity', newAnalysis: '🔄 New Analysis',
    analysisFailed: 'Analysis failed', shareCard: 'Share Your Identity',
    nextReport: 'Next report in', days: 'days',
    progressTitle: 'Directly is watching your style', progressSubtitle: 'messages to unlock your first analysis',
    firstInsight: 'We noticed something about you',
  },
  fr: {
    yourMode: 'Votre mode', yourPattern: 'Votre identité', received: 'Reçus', sent: 'Envoyés',
    peak: 'Pic', distribution: 'Répartition', private: 'Privé', work: 'Travail',
    audience: 'Public', discoverPattern: 'Découvrez qui vous êtes', whatDoesYourComm: 'Votre façon de communiquer dit tout sur vous.',
    discovering: 'Analyse en cours...', discoverBtn: 'Découvrez votre identité', newAnalysis: '🔄 Nouvelle analyse',
    analysisFailed: 'Analyse échouée', shareCard: 'Partagez votre identité',
    nextReport: 'Prochain rapport dans', days: 'jours',
    progressTitle: 'Directly observe votre style', progressSubtitle: 'messages pour débloquer votre analyse',
    firstInsight: 'Nous avons remarqué quelque chose',
  },
  es: {
    yourMode: 'Tu modo', yourPattern: 'Tu identidad', received: 'Recibidos', sent: 'Enviados',
    peak: 'Pico', distribution: 'Distribución', private: 'Privado', work: 'Trabajo',
    audience: 'Audiencia', discoverPattern: 'Descubre quién eres', whatDoesYourComm: 'Cómo te comunicas dice todo sobre ti.',
    discovering: 'Leyendo tu estilo...', discoverBtn: 'Descubre tu identidad', newAnalysis: '🔄 Nuevo análisis',
    analysisFailed: 'Análisis fallido', shareCard: 'Comparte tu identidad',
    nextReport: 'Próximo informe en', days: 'días',
    progressTitle: 'Directly observa tu estilo', progressSubtitle: 'mensajes para desbloquear tu análisis',
    firstInsight: 'Notamos algo sobre ti',
  },
};

export default function CommunicationPatterns({ userId }: { userId: string }) {
  const { isRTL, language } = useLanguage();
  const { mood, setMood } = useMood();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<PersonalityAnalysis | null>(null);
  const [totalMessages, setTotalMessages] = useState(0);
  const l = L[language] || L.en;

  const lastWeekStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return getWeekStart(d);
  }, []);

  useEffect(() => {
    const loadCachedAnalysis = async () => {
      const { data } = await supabase.from('weekly_analysis').select('analysis').eq('user_id', userId).eq('week_start', lastWeekStart).maybeSingle();
      if (data?.analysis) {
        const cached = data.analysis as any;
        // Only use cached analysis if its language matches the current UI language
        if (cached?._language === language) {
          setAnalysis(cached as PersonalityAnalysis);
        } else {
          // Language mismatch — clear so user can regenerate in current language
          setAnalysis(null);
        }
      } else {
        setAnalysis(null);
      }
    };
    if (userId) loadCachedAnalysis();
  }, [userId, lastWeekStart, language]);

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      const weekStart = new Date(lastWeekStart);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const [{ data: recv }, { data: sent }, { count }] = await Promise.all([
        supabase.from('messages').select('id, category, created_at, sender_id, receiver_id').eq('receiver_id', userId).gte('created_at', weekStart.toISOString()).lt('created_at', weekEnd.toISOString()),
        supabase.from('messages').select('id, category, created_at, sender_id, receiver_id').eq('sender_id', userId).gte('created_at', weekStart.toISOString()).lt('created_at', weekEnd.toISOString()),
        supabase.from('messages').select('*', { count: 'exact', head: true }).or(`receiver_id.eq.${userId},sender_id.eq.${userId}`),
      ]);
      setMessages([...(recv || []), ...(sent || [])] as Message[]);
      setTotalMessages(count || 0);
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
        const analysisData = { ...data, _language: language } as PersonalityAnalysis & { _language: string };
        setAnalysis(analysisData);
        await supabase.from('weekly_analysis').upsert({
          user_id: userId, week_start: lastWeekStart, analysis: analysisData as any,
        }, { onConflict: 'user_id,week_start' });
      } else toast.error(l.analysisFailed);
    } catch { toast.error(l.analysisFailed); }
    finally { setIsAnalyzing(false); }
  };

  const handleShareCard = () => {
    shareCardAsImage('pattern-vip-card', 'My Communication Identity — Directly',
      analysis?.type ? `I'm a "${analysis.type}" communicator ✨` : 'Check out my pattern on Directly!');
  };

  const fmtHour = (h: number) => isRTL
    ? (h < 12 ? `${h || 12} ص` : `${h - 12 || 12} م`)
    : (h < 12 ? `${h || 12} AM` : `${h - 12 || 12} PM`);

  const weekLabel = useMemo(() => {
    const start = new Date(lastWeekStart);
    const end = new Date(start); end.setDate(end.getDate() + 6);
    const fmt = new Intl.DateTimeFormat(language === 'ar' ? 'ar' : language, { month: 'short', day: 'numeric' });
    return `${fmt.format(start)} – ${fmt.format(end)}`;
  }, [lastWeekStart, language]);

  const daysUntilNext = useMemo(() => {
    const nextWeekStart = new Date(lastWeekStart);
    nextWeekStart.setDate(nextWeekStart.getDate() + 14);
    return Math.max(0, Math.ceil((nextWeekStart.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  }, [lastWeekStart]);

  // Progress for new users (need 10 messages)
  const progressPercent = Math.min(100, (totalMessages / 10) * 100);
  const showProgress = totalMessages < 10 && !analysis;

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
      {/* New User Progress Bar */}
      {showProgress && (
        <div className="p-5 rounded-2xl border border-primary/15 bg-card" style={{ background: 'var(--gradient-gold-soft)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Brain className="h-5 w-5 text-primary animate-pulse-subtle" />
            </div>
            <div>
              <p className="font-semibold text-sm">{l.progressTitle}</p>
              <p className="text-xs text-muted-foreground">{10 - totalMessages} {l.progressSubtitle}</p>
            </div>
          </div>
          <Progress value={progressPercent} className="h-2.5" />
          <div className="flex justify-between mt-2">
            <span className="text-[10px] text-muted-foreground">{totalMessages}/10</span>
            <span className="text-[10px] text-primary font-medium">{Math.round(progressPercent)}%</span>
          </div>
        </div>
      )}

      {/* Mood Selector */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">{l.yourMode}</h3>
        <div className="grid grid-cols-4 gap-2">
          {moodConfigs.map((m) => (
            <button key={m.id} onClick={() => setMood(m.id)}
              className={cn('flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all touch-feedback border',
                mood === m.id ? 'bg-primary/10 border-primary/30 text-foreground' : 'bg-card border-border text-muted-foreground'
              )}
            >
              <span className="text-xl">{m.emoji}</span>
              <span className="text-[10px] font-semibold">{m.label[language] || m.label.en}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl" style={{ background: 'var(--gradient-gold)' }}>
            <Crown className="h-5 w-5 text-white" />
          </div>
          <h2 className="font-bold text-lg">{l.yourPattern}</h2>
        </div>
        <span className="text-[11px] text-muted-foreground font-medium">{weekLabel}</span>
      </div>

      {/* AI Personality — VIP Card (Rolls-Royce / Apple style) */}
      {analysis ? (
        <div className="space-y-4 animate-fade-in-up">
          {/* VIP Identity Card — dark luxury */}
          <div id="pattern-vip-card" className="relative overflow-hidden rounded-3xl" style={{
            background: 'linear-gradient(160deg, #0a0a0a 0%, #1a1520 40%, #0d1117 100%)',
            boxShadow: '0 20px 60px -15px rgba(212, 175, 55, 0.15), 0 0 0 1px rgba(212, 175, 55, 0.1)',
          }}>
            {/* Luxury overlay pattern */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: 'radial-gradient(circle at 25% 25%, #D4AF37 1px, transparent 1px)',
              backgroundSize: '30px 30px',
            }} />
            {/* Gold glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[200px] rounded-full opacity-15" style={{
              background: 'radial-gradient(circle, #D4AF37, transparent 70%)',
            }} />

            <div className="relative z-10 p-7 text-center">
              {/* Crown icon */}
              <div className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center" style={{
                background: 'linear-gradient(135deg, #D4AF37, #B8860B)',
                boxShadow: '0 4px 20px rgba(212, 175, 55, 0.4)',
              }}>
                <Crown className="h-6 w-6 text-black" />
              </div>

              {/* §1 — Identity */}
              <h3 className="text-2xl font-bold text-white mb-1 tracking-tight">{analysis.type}</h3>
              <p className="text-sm text-white/50 mb-5 max-w-[280px] mx-auto leading-relaxed">{analysis.description}</p>

              {/* §2 — Three Traits */}
              <div className="flex flex-wrap gap-2 justify-center mb-5">
                {analysis.traits.map((t, i) => (
                  <span key={i} className="px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide"
                    style={{
                      background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(184,134,11,0.1))',
                      border: '1px solid rgba(212,175,55,0.25)',
                      color: '#D4AF37',
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>

              {/* §3 — Key Numbers */}
              <div className="grid grid-cols-3 gap-2 mb-5">
                {[
                  { value: `${stats.responseRate}%`, label: isRTL ? 'الرد' : 'Reply' },
                  { value: fmtHour(stats.peakHour), label: isRTL ? 'الذروة' : 'Peak' },
                  { value: `${stats.sent}`, label: isRTL ? 'محادثات' : 'Chats' },
                ].map((item, i) => (
                  <div key={i} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-lg font-bold text-white">{item.value}</p>
                    <p className="text-[10px] text-white/35 font-medium uppercase tracking-wider">{item.label}</p>
                  </div>
                ))}
              </div>

              {/* §4 — Social Comparison */}
              {analysis.percentile && (
                <div className="rounded-xl p-3 mb-5 flex items-center justify-center gap-2" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.15)' }}>
                  <BarChart3 className="h-4 w-4" style={{ color: '#D4AF37' }} />
                  <p className="text-xs font-medium" style={{ color: '#D4AF37' }}>{analysis.percentile}</p>
                </div>
              )}

              {/* §5 — Personal Analysis */}
              {analysis.main_sentence && (
                <p className="text-sm text-white/70 italic mb-2 leading-relaxed">"{analysis.main_sentence}"</p>
              )}
              {analysis.inner_sentence && (
                <p className="text-xs mb-5 leading-relaxed" style={{ color: 'rgba(212,175,55,0.6)' }}>{analysis.inner_sentence}</p>
              )}

              {/* §6 — Badge */}
              {analysis.badge && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5" style={{
                  background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(184,134,11,0.08))',
                  border: '1px solid rgba(212,175,55,0.3)',
                }}>
                  <Award className="h-4 w-4" style={{ color: '#D4AF37' }} />
                  <span className="text-xs font-semibold" style={{ color: '#D4AF37' }}>{analysis.badge}</span>
                </div>
              )}

              {/* Security badge */}
              <div className="flex items-center justify-center gap-1.5 mb-3">
                <Shield className="h-3 w-3 text-emerald-400/60" />
                <span className="text-[10px] text-emerald-400/60 font-medium">End-to-End Encrypted</span>
              </div>

              {/* Brand footer */}
              <div className="flex items-center justify-center gap-1.5">
                <Star className="h-3 w-3 text-white/20" />
                <p className="text-[10px] text-white/20 tracking-widest uppercase font-medium">Directly — Smart Communication</p>
                <Star className="h-3 w-3 text-white/20" />
              </div>
            </div>
          </div>

          {/* §7 — Share Button */}
          <Button onClick={handleShareCard} className="w-full h-12 text-[15px] font-semibold rounded-2xl gap-2 border-0"
            style={{ background: 'linear-gradient(135deg, #D4AF37, #B8860B)', color: '#000' }}
          >
            <Share2 className="h-5 w-5" />
            {l.shareCard}
          </Button>

          {/* Tips */}
          {analysis.advice && (
            <div className="p-4 rounded-2xl border border-border bg-card">
              <p className="text-sm text-muted-foreground">💡 {analysis.advice}</p>
            </div>
          )}
          {analysis.insight && (
            <div className="p-4 rounded-2xl border border-border bg-card">
              <p className="text-xs text-muted-foreground">🧠 {analysis.insight}</p>
            </div>
          )}

          {/* §8 — Next Report */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-2">
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
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: Mail, label: l.received, value: stats.received },
              { icon: Send, label: l.sent, value: stats.sent },
              { icon: Clock, label: l.peak, value: fmtHour(stats.peakHour) },
            ].map((item, i) => (
              <Card key={i} className="p-3 border-primary/10">
                <div className="flex items-center gap-1.5 mb-1">
                  <item.icon className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[11px] text-muted-foreground">{item.label}</span>
                </div>
                <p className={cn('font-bold', typeof item.value === 'number' ? 'text-xl' : 'text-sm')}>{item.value}</p>
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
          <div className="relative overflow-hidden rounded-3xl p-6 text-center" style={{
            background: 'linear-gradient(160deg, #0a0a0a 0%, #1a1520 50%, #0d1117 100%)',
            boxShadow: '0 15px 40px -10px rgba(212,175,55,0.12), 0 0 0 1px rgba(212,175,55,0.1)',
          }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150px] h-[150px] rounded-full opacity-10" style={{
              background: 'radial-gradient(circle, #D4AF37, transparent 70%)',
            }} />
            <div className="relative z-10">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center" style={{
                background: 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(184,134,11,0.1))',
                border: '1px solid rgba(212,175,55,0.3)',
              }}>
                <Brain className="h-7 w-7 animate-crown" style={{ color: '#D4AF37' }} />
              </div>
              <p className="text-lg font-bold text-white mb-1">{l.discoverPattern}</p>
              <p className="text-sm text-white/50 mb-5 max-w-[260px] mx-auto">{l.whatDoesYourComm}</p>
              <Button onClick={analyzePersonality} disabled={isAnalyzing} size="lg"
                className="h-12 px-8 text-[15px] rounded-2xl touch-feedback border-0"
                style={{ background: 'linear-gradient(135deg, #D4AF37, #B8860B)', color: '#000' }}
              >
                {isAnalyzing ? (
                  <><Loader2 className="h-5 w-5 animate-spin me-2" />{l.discovering}</>
                ) : (
                  <><Sparkles className="h-5 w-5 me-2" />{l.discoverBtn}</>
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
