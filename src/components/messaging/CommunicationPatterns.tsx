import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Mail, Send, Clock, Heart, Briefcase, Users, Sparkles, Brain, Loader2, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMood, moodConfigs } from '@/hooks/useMood';
import { cn } from '@/lib/utils';

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
}

function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split('T')[0];
}

export default function CommunicationPatterns({ userId }: { userId: string }) {
  const { isRTL, language } = useLanguage();
  const { mood, setMood } = useMood();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<PersonalityAnalysis | null>(null);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = last week, etc.

  const currentWeekStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    return getWeekStart(d);
  }, [weekOffset]);

  // Load cached analysis from DB
  useEffect(() => {
    const loadCachedAnalysis = async () => {
      const { data } = await supabase
        .from('weekly_analysis')
        .select('analysis')
        .eq('user_id', userId)
        .eq('week_start', currentWeekStart)
        .single();
      if (data?.analysis) {
        setAnalysis(data.analysis as unknown as PersonalityAnalysis);
      } else {
        setAnalysis(null);
      }
    };
    if (userId) loadCachedAnalysis();
  }, [userId, currentWeekStart]);

  // Re-analyze when language changes — clear cached analysis and force fresh one
  useEffect(() => {
    if (weekOffset === 0 && userId) {
      setAnalysis(null);
      // Small delay to let state clear, then re-analyze
      const timer = setTimeout(() => analyzePersonality(), 300);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      const weekStart = new Date(currentWeekStart);
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
  }, [userId, currentWeekStart]);

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
            responseRate: stats.received > 0 ? Math.round(stats.sent / stats.received * 100) : 0,
            mostActiveHour: stats.peakHour, period: 'week',
          },
          language,
        },
      });
      if (error) throw error;
      if (data?.type) {
        const analysisData = data as PersonalityAnalysis;
        setAnalysis(analysisData);
        // Cache in DB
        await supabase.from('weekly_analysis').upsert({
          user_id: userId,
          week_start: currentWeekStart,
          analysis: analysisData as any,
        }, { onConflict: 'user_id,week_start' });
      } else {
        toast.error(isRTL ? 'تعذر التحليل' : 'Analysis unavailable');
      }
    } catch {
      toast.error(isRTL ? 'تعذر التحليل' : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const shareAnalysis = async () => {
    if (!analysis) return;
    // Get username for the share link
    const { data: profile } = await supabase.from('profiles').select('username').eq('id', userId).single();
    const profileUrl = profile?.username ? `${window.location.origin}/@${profile.username}` : '';
    const text = `✨ ${analysis.type}\n${analysis.description}\n\n${analysis.traits.join(' · ')}\n\n💡 ${analysis.advice}\n\n${profileUrl}\n— Directly App`;
    
    try {
      if (navigator.share) {
        await navigator.share({ title: 'My Communication Pattern — Directly', text });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        toast.success(isRTL ? 'تم النسخ! شاركه في Story ✨' : 'Copied! Share it on your Story ✨');
      }
    } catch { /* cancelled */ }
  };

  const fmtHour = (h: number) => isRTL
    ? (h < 12 ? `${h || 12} ص` : `${h - 12 || 12} م`)
    : (h < 12 ? `${h || 12} AM` : `${h - 12 || 12} PM`);

  const weekLabel = useMemo(() => {
    const start = new Date(currentWeekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const fmt = new Intl.DateTimeFormat(isRTL ? 'ar' : 'en', { month: 'short', day: 'numeric' });
    return `${fmt.format(start)} – ${fmt.format(end)}`;
  }, [currentWeekStart, isRTL]);

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
        <h3 className="text-base font-semibold text-muted-foreground">{isRTL ? 'نمطك الحالي' : 'Your Mode'}</h3>
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

      {/* Week navigation */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Crown className="h-5 w-5 text-primary" />
          </div>
          <h2 className="font-bold text-lg">{isRTL ? 'نمط تواصلك' : 'Your Pattern'}</h2>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setWeekOffset(w => w - 1)} className="h-8 w-8 rounded-lg">
            {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
          <span className="text-xs text-muted-foreground font-medium min-w-[100px] text-center">{weekLabel}</span>
          <Button variant="ghost" size="icon" onClick={() => setWeekOffset(w => Math.min(w + 1, 0))} disabled={weekOffset >= 0} className="h-8 w-8 rounded-lg">
            {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Mail, label: isRTL ? 'مستلمة' : 'Received', value: stats.received },
          { icon: Send, label: isRTL ? 'مرسلة' : 'Sent', value: stats.sent },
          { icon: Clock, label: isRTL ? 'الذروة' : 'Peak', value: fmtHour(stats.peakHour) },
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
          {isRTL ? 'التوزيع' : 'Distribution'}
        </h3>
        <div className="space-y-3">
          {[
            { icon: Heart, label: isRTL ? 'الخاص' : 'Private', pct: stats.directPct, color: 'bg-[hsl(var(--others))]' },
            { icon: Briefcase, label: isRTL ? 'العمل' : 'Work', pct: stats.workPct, color: 'bg-[hsl(var(--work))]' },
            { icon: Users, label: isRTL ? 'العلاقات' : 'Audience', pct: stats.audiencePct, color: 'bg-[hsl(var(--audience))]' },
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

      {/* AI Personality — weekly cached */}
      <Card className="border-primary/15 overflow-hidden" style={{ background: 'var(--gradient-gold-soft)' }}>
        <CardContent className="p-5">
          {analysis ? (
            <div className="space-y-4 animate-fade-in-up">
              <div className="text-center p-5 bg-card rounded-2xl border border-primary/15 relative">
                <p className="text-2xl font-bold mb-1">{analysis.type}</p>
                <p className="text-sm text-muted-foreground">{analysis.description}</p>
                <button onClick={shareAnalysis} className="absolute top-3 end-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <Share2 className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 justify-center">
                {analysis.traits.map((t, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-full bg-primary/10 text-primary font-semibold text-xs border border-primary/15">
                    {t}
                  </span>
                ))}
              </div>

              <p className="text-sm text-center text-muted-foreground italic">💡 {analysis.advice}</p>

              {analysis.insight && (
                <p className="text-xs text-center text-muted-foreground/70">🧠 {analysis.insight}</p>
              )}

              {weekOffset === 0 && (
                <Button variant="ghost" onClick={() => { setAnalysis(null); analyzePersonality(); }} className="w-full text-sm text-muted-foreground">
                  {isRTL ? '🔄 تحليل جديد' : '🔄 New Analysis'}
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <Brain className="h-10 w-10 text-primary mx-auto mb-3 animate-crown" />
              <p className="text-lg font-bold mb-1">
                {isRTL ? 'اكتشف نمطك' : 'Discover Your Pattern'}
              </p>
              <p className="text-sm text-muted-foreground mb-5">
                {isRTL ? 'ماذا يقول تواصلك عن شخصيتك؟' : 'What does your communication say about you?'}
              </p>
              <Button
                onClick={analyzePersonality}
                disabled={isAnalyzing || weekOffset !== 0}
                size="lg"
                className="h-13 px-8 text-base rounded-2xl touch-feedback"
              >
                {isAnalyzing ? (
                  <><Loader2 className="h-5 w-5 animate-spin me-2" />{isRTL ? 'اكتشاف نمطك...' : 'Discovering your pattern...'}</>
                ) : (
                  <><Sparkles className="h-5 w-5 me-2" />{isRTL ? 'اكتشف نمطك' : 'Discover Your Pattern'}</>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
