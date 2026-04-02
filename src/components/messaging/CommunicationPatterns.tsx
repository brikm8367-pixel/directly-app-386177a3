import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Crown, Mail, Send, Clock, Heart, Briefcase, Users, Sparkles, Brain, Loader2, Share2, Trophy, TrendingUp, Zap, Calendar, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMood, moodConfigs } from '@/hooks/useMood';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  category: 'work' | 'audience' | 'direct';
  created_at: string;
  sender_id: string;
  receiver_id: string;
  content?: string;
}

interface PersonalityAnalysis {
  type: string;
  description: string;
  traits: string[];
  advice: string;
  insight?: string;
  stats?: { replyRate: string; avgResponseTime: string; conversationsStarted: string };
  comparison?: string;
  analysis?: string;
  badge?: string;
  nextReportDays?: number;
}

function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split('T')[0];
}

const L: Record<string, Record<string, string>> = {
  ar: {
    yourMode: 'نمطك الحالي', yourPattern: 'هكذا تتواصل أنت.', received: 'مستلمة', sent: 'مرسلة',
    peak: 'الذروة', distribution: 'التوزيع', private: 'الخاص', work: 'العمل',
    audience: 'العلاقات', discoverPattern: 'اكتشف نمطك', whatDoesYourComm: 'كيف تطورت هذا الأسبوع؟',
    discovering: 'اكتشاف نمطك...', discoverBtn: 'كيف تطورت هذا الأسبوع؟', newAnalysis: '🔄 تحليل جديد',
    analysisFailed: 'تعذر التحليل', copied: 'تم النسخ! شاركه في Story ✨',
    observing: 'Directly يراقب طريقة تواصلك الآن.',
    moreYouTalk: 'كلما تواصلت أكثر — كلما فهمك Directly أعمق.',
    startedNoticing: 'بدأنا نفهمك',
    fullAnalysis: 'هكذا تتواصل أنت — اكتشفناه بعد أسبوع من المراقبة الدقيقة.',
    nextReport: 'التقرير القادم بعد',
    days: 'أيام',
    shareIt: 'هذا أنت — شاركه مع من تريد.',
    whereShare: 'أين تريد أن يعرفوك؟',
    shared: 'شاركت نمطك — الآن يعرفون من أنت حقاً.',
    replyRate: 'معدل الرد', avgResponse: 'متوسط الرد', started: 'محادثات بدأتها',
  },
  en: {
    yourMode: 'Your Mode', yourPattern: 'This is how you communicate.', received: 'Received', sent: 'Sent',
    peak: 'Peak', distribution: 'Distribution', private: 'Private', work: 'Work',
    audience: 'Relationships', discoverPattern: 'Discover Your Pattern', whatDoesYourComm: 'How did you evolve this week?',
    discovering: 'Discovering your pattern...', discoverBtn: 'How did you evolve this week?', newAnalysis: '🔄 New Analysis',
    analysisFailed: 'Analysis failed', copied: 'Copied! Share it on your Story ✨',
    observing: 'Directly is observing your communication now.',
    moreYouTalk: 'The more you communicate — the deeper Directly understands you.',
    startedNoticing: 'We\'re starting to understand you',
    fullAnalysis: 'This is how you communicate — discovered after a week of careful observation.',
    nextReport: 'Next report in',
    days: 'days',
    shareIt: 'This is you — share it with whoever you want.',
    whereShare: 'Where do you want to be known?',
    shared: 'You shared your pattern — now they know who you really are.',
    replyRate: 'Reply Rate', avgResponse: 'Avg Response', started: 'Started',
  },
  fr: {
    yourMode: 'Votre mode', yourPattern: 'Voilà comment vous communiquez.', received: 'Reçus', sent: 'Envoyés',
    peak: 'Pic', distribution: 'Répartition', private: 'Privé', work: 'Travail',
    audience: 'Relations', discoverPattern: 'Découvrez votre schéma', whatDoesYourComm: 'Comment avez-vous évolué cette semaine ?',
    discovering: 'Découverte en cours...', discoverBtn: 'Comment avez-vous évolué ?', newAnalysis: '🔄 Nouvelle analyse',
    analysisFailed: 'Analyse échouée', copied: 'Copié ! Partagez-le dans votre Story ✨',
    observing: 'Directly observe votre communication maintenant.',
    moreYouTalk: 'Plus vous communiquez — plus Directly vous comprend.',
    startedNoticing: 'On commence à vous comprendre',
    fullAnalysis: 'Voilà comment vous communiquez — découvert après une semaine d\'observation.',
    nextReport: 'Prochain rapport dans',
    days: 'jours',
    shareIt: 'C\'est vous — partagez-le.',
    whereShare: 'Où voulez-vous être connu ?',
    shared: 'Vous avez partagé votre profil.',
    replyRate: 'Taux de réponse', avgResponse: 'Réponse moy.', started: 'Initiées',
  },
  es: {
    yourMode: 'Tu modo', yourPattern: 'Así es como te comunicas.', received: 'Recibidos', sent: 'Enviados',
    peak: 'Pico', distribution: 'Distribución', private: 'Privado', work: 'Trabajo',
    audience: 'Relaciones', discoverPattern: 'Descubre tu patrón', whatDoesYourComm: '¿Cómo evolucionaste esta semana?',
    discovering: 'Descubriendo tu patrón...', discoverBtn: '¿Cómo evolucionaste?', newAnalysis: '🔄 Nuevo análisis',
    analysisFailed: 'Análisis fallido', copied: '¡Copiado! Compártelo en tu Story ✨',
    observing: 'Directly está observando tu comunicación ahora.',
    moreYouTalk: 'Cuanto más te comunicas — más profundo te entiende Directly.',
    startedNoticing: 'Estamos empezando a entenderte',
    fullAnalysis: 'Así te comunicas — descubierto tras una semana de observación.',
    nextReport: 'Próximo informe en',
    days: 'días',
    shareIt: 'Este eres tú — compártelo.',
    whereShare: '¿Dónde quieres que te conozcan?',
    shared: 'Compartiste tu patrón.',
    replyRate: 'Tasa de respuesta', avgResponse: 'Resp. promedio', started: 'Iniciadas',
  },
};

export default function CommunicationPatterns({ userId }: { userId: string }) {
  const { isRTL, language } = useLanguage();
  const { mood, setMood } = useMood();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<PersonalityAnalysis | null>(null);
  const [accountAge, setAccountAge] = useState(0); // days since signup
  const l = L[language] || L.en;

  const lastWeekStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return getWeekStart(d);
  }, []);

  // Check account age
  useEffect(() => {
    const checkAge = async () => {
      const { data } = await supabase.from('profiles').select('created_at').eq('id', userId).single();
      if (data?.created_at) {
        const days = Math.floor((Date.now() - new Date(data.created_at).getTime()) / 86400000);
        setAccountAge(days);
      }
    };
    if (userId) checkAge();
  }, [userId]);

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
      } else {
        setAnalysis(null);
      }
    };
    if (userId) loadCachedAnalysis();
  }, [userId, lastWeekStart]);

  useEffect(() => {
    if (userId) {
      setAnalysis(null);
      const timer = setTimeout(() => analyzePersonality(), 300);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

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
    const days: Record<number, number> = {};
    recv.forEach(m => {
      const d = new Date(m.created_at);
      hours[d.getHours()] = (hours[d.getHours()] || 0) + 1;
      days[d.getDay()] = (days[d.getDay()] || 0) + 1;
    });
    const peakHour = Object.entries(hours).sort((a, b) => b[1] - a[1])[0]?.[0] || '12';
    const busiestDay = Object.entries(days).sort((a, b) => b[1] - a[1])[0]?.[0] || '1';
    const total = recv.length || 1;
    const uniqueContacts = new Set([...recv.map(m => m.sender_id), ...sent.map(m => m.receiver_id)]).size;
    const activeDays = new Set(messages.map(m => new Date(m.created_at).toDateString())).size;

    return {
      received: recv.length, sent: sent.length, byCategory, peakHour: parseInt(peakHour),
      workPct: Math.round((byCategory.work / total) * 100),
      audiencePct: Math.round((byCategory.audience / total) * 100),
      directPct: Math.round((byCategory.direct / total) * 100),
      uniqueContacts, activeDays, busiestDay: parseInt(busiestDay),
      totalMessages: messages.length,
      initiatedCount: sent.length,
    };
  }, [messages, userId]);

  const analyzePersonality = async () => {
    setIsAnalyzing(true);
    try {
      const { data: directAccess } = await supabase.from('direct_access').select('id').eq('owner_id', userId);
      
      const { data, error } = await supabase.functions.invoke('analyze-personality', {
        body: {
          stats: {
            totalReceived: stats.received, totalSent: stats.sent,
            workCount: stats.byCategory.work, audienceCount: stats.byCategory.audience, directCount: stats.byCategory.direct,
            workRatio: stats.workPct, audienceRatio: stats.audiencePct, directRatio: stats.directPct,
            responseRate: stats.received > 0 ? Math.round(stats.sent / stats.received * 100) : 0,
            mostActiveHour: stats.peakHour,
            initiatedCount: stats.initiatedCount,
            uniqueContacts: stats.uniqueContacts,
            activeDays: stats.activeDays,
            busiestDay: stats.busiestDay,
            privateCircleSize: directAccess?.length || 0,
            period: 'week',
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

  const shareAnalysis = async () => {
    if (!analysis) return;
    const { data: profile } = await supabase.from('profiles').select('username').eq('id', userId).single();
    const profileUrl = profile?.username ? `${window.location.origin}/@${profile.username}` : '';
    const { shareAnalysisText } = await import('@/utils/sharing');
    await shareAnalysisText(analysis, profileUrl, l.shared);
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

  const progressPct = Math.min((stats.totalMessages / 10) * 100, 100);
  const phase = stats.totalMessages >= 10 && accountAge >= 7 ? 3 : stats.totalMessages >= 10 ? 2 : 1;

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

      {/* Phase 1: Observing (< 10 messages, < 7 days) */}
      {phase === 1 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-6 border-primary/10 text-center">
            <Brain className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
            <p className="font-semibold text-base mb-2">{l.observing}</p>
            <p className="text-sm text-muted-foreground mb-5">{l.moreYouTalk}</p>
            <Progress value={progressPct} className="h-2 mb-2" />
            <p className="text-xs text-muted-foreground">{stats.totalMessages}/10</p>
          </Card>
        </motion.div>
      )}

      {/* Phase 2: Early insight (10+ messages, < 7 days) */}
      {phase === 2 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-6 border-primary/10 text-center">
            <Sparkles className="h-10 w-10 text-primary mx-auto mb-3" />
            <p className="font-semibold text-base mb-2">{l.startedNoticing}</p>
            <p className="text-sm text-muted-foreground mb-4">
              {stats.initiatedCount > stats.received
                ? (isRTL ? 'لاحظنا أنك تبدأ معظم محادثاتك — هذا يقول شيئاً عنك.' : 'We noticed you start most conversations — that says something about you.')
                : (isRTL ? 'لاحظنا أنك تنتظر حتى يبدأ الآخرون — وهذا يقول شيئاً عنك.' : 'We noticed you wait for others to reach out — that says something about you.')}
            </p>
            <Progress value={Math.min((accountAge / 7) * 100, 95)} className="h-2 mb-2" />
            <p className="text-xs text-muted-foreground">{l.nextReport} {Math.max(7 - accountAge, 1)} {l.days}</p>
          </Card>
        </motion.div>
      )}

      {/* Stats (always visible) */}
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
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.pct}%` }}
                  transition={{ duration: 0.7, delay: i * 0.1 }}
                  className={cn('h-full rounded-full', item.color)}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Phase 3: Full 8-section analysis */}
      {phase === 3 && (
        <Card className="border-primary/15 overflow-hidden" style={{ background: 'var(--gradient-gold-soft)' }}>
          <CardContent className="p-5">
            {analysis ? (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                {/* §1 — Identity Title */}
                <div className="text-center p-6 bg-card rounded-2xl border border-primary/15 relative"
                  style={{ background: 'linear-gradient(135deg, hsl(var(--card)), hsl(var(--primary) / 0.05))' }}>
                  <p className="text-2xl font-bold mb-1">{analysis.type}</p>
                  <p className="text-sm text-muted-foreground">{analysis.description}</p>
                  <button onClick={shareAnalysis} className="absolute top-3 end-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <Share2 className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>

                {/* §2 — Three Traits */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {analysis.traits?.map((t, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="px-3 py-1.5 rounded-full bg-primary/10 text-primary font-semibold text-xs border border-primary/15"
                    >
                      {t}
                    </motion.span>
                  ))}
                </div>

                {/* §3 — Stats */}
                {analysis.stats && (
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: l.replyRate, value: analysis.stats.replyRate, icon: TrendingUp },
                      { label: l.avgResponse, value: analysis.stats.avgResponseTime, icon: Zap },
                      { label: l.started, value: analysis.stats.conversationsStarted, icon: Send },
                    ].map((s, i) => (
                      <div key={i} className="text-center p-3 rounded-xl bg-card border border-border">
                        <s.icon className="h-4 w-4 text-primary mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                        <p className="font-bold text-sm">{s.value}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* §4 — Social Comparison */}
                {analysis.comparison && (
                  <div className="text-center p-3 rounded-xl bg-primary/5 border border-primary/10">
                    <Trophy className="h-5 w-5 text-primary mx-auto mb-1" />
                    <p className="text-sm font-medium">{analysis.comparison}</p>
                  </div>
                )}

                {/* §5 — Personal Analysis */}
                {analysis.analysis && (
                  <p className="text-sm text-center text-muted-foreground leading-relaxed italic px-2">
                    {analysis.analysis}
                  </p>
                )}

                {/* §6 — Achievement Badge */}
                {analysis.badge && (
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                      <Award className="h-4 w-4 text-primary" />
                      <span className="text-sm font-bold text-primary">{analysis.badge}</span>
                    </div>
                  </div>
                )}

                {/* §7 — Share Button */}
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-2">{l.shareIt}</p>
                  <Button onClick={shareAnalysis} className="rounded-2xl h-12 px-8">
                    <Share2 className="h-5 w-5 me-2" />
                    {l.whereShare}
                  </Button>
                </div>

                {/* §8 — Next Report */}
                <div className="text-center flex items-center justify-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <p className="text-xs">{l.nextReport} {analysis.nextReportDays || 7} {l.days}</p>
                </div>

                {/* Advice & Insight */}
                {analysis.advice && (
                  <p className="text-sm text-center text-muted-foreground">💡 {analysis.advice}</p>
                )}
                {analysis.insight && (
                  <p className="text-xs text-center text-muted-foreground/70">🧠 {analysis.insight}</p>
                )}

                <Button variant="ghost" onClick={() => { setAnalysis(null); analyzePersonality(); }} className="w-full text-sm text-muted-foreground">
                  {l.newAnalysis}
                </Button>
              </motion.div>
            ) : (
              <div className="text-center py-6">
                <Brain className="h-10 w-10 text-primary mx-auto mb-3 animate-crown" />
                <p className="text-lg font-bold mb-1">{l.discoverPattern}</p>
                <p className="text-sm text-muted-foreground mb-1">{l.fullAnalysis}</p>
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
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
