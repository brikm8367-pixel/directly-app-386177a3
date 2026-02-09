import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Crown, Mail, Send, Clock, Heart, Briefcase, Users, Sparkles, Brain, Loader2, Lightbulb } from 'lucide-react';
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

export default function CommunicationPatterns({ userId }: { userId: string }) {
  const { isRTL } = useLanguage();
  const { mood, setMood } = useMood();
  const [messages, setMessages] = useState<Message[]>([]);
  const [period, setPeriod] = useState<'week' | 'month'>('month');
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<PersonalityAnalysis | null>(null);

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      const days = period === 'week' ? 7 : 30;
      const start = new Date();
      start.setDate(start.getDate() - days);

      const [{ data: recv }, { data: sent }] = await Promise.all([
        supabase.from('messages').select('id, category, created_at, sender_id, receiver_id').eq('receiver_id', userId).gte('created_at', start.toISOString()),
        supabase.from('messages').select('id, category, created_at, sender_id, receiver_id').eq('sender_id', userId).gte('created_at', start.toISOString()),
      ]);
      setMessages([...(recv || []), ...(sent || [])] as Message[]);
      setIsLoading(false);
    };
    if (userId) fetch();
  }, [userId, period]);

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
            mostActiveHour: stats.peakHour, period,
          },
          language: isRTL ? 'ar' : 'en',
        },
      });
      if (error) throw error;
      if (data?.type) setAnalysis(data as PersonalityAnalysis);
      else toast.error(isRTL ? 'تعذر التحليل' : 'Analysis unavailable');
    } catch {
      toast.error(isRTL ? 'تعذر التحليل' : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const fmtHour = (h: number) => isRTL
    ? (h < 12 ? `${h || 12} ص` : `${h - 12 || 12} م`)
    : (h < 12 ? `${h || 12} AM` : `${h - 12 || 12} PM`);

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
              <span className="text-xs font-semibold">{m.label[isRTL ? 'ar' : 'en']}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Period + Title */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Crown className="h-5 w-5 text-primary" />
          </div>
          <h2 className="font-bold text-lg">{isRTL ? 'نمط تواصلك' : 'Your Pattern'}</h2>
        </div>
        <Select value={period} onValueChange={(v: 'week' | 'month') => { setPeriod(v); setAnalysis(null); }}>
          <SelectTrigger className="w-28 h-10 rounded-xl border-primary/20 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">{isRTL ? 'أسبوع' : 'Week'}</SelectItem>
            <SelectItem value="month">{isRTL ? 'شهر' : 'Month'}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Mail, label: isRTL ? 'مستلمة' : 'Received', value: stats.received },
          { icon: Send, label: isRTL ? 'مرسلة' : 'Sent', value: stats.sent },
          { icon: Clock, label: isRTL ? 'ذروة النشاط' : 'Peak', value: fmtHour(stats.peakHour) },
        ].map((item, i) => (
          <Card key={i} className="p-3 border-primary/10">
            <div className="flex items-center gap-1.5 mb-1.5">
              <item.icon className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
            <p className={cn('font-bold', typeof item.value === 'number' ? 'text-2xl' : 'text-sm')}>{item.value}</p>
          </Card>
        ))}
      </div>

      {/* Distribution */}
      <Card className="p-4 border-primary/10">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          {isRTL ? 'توزيع رسائلك' : 'Message Distribution'}
        </h3>
        <div className="space-y-4">
          {[
            { icon: Heart, label: isRTL ? 'الخاص' : 'Private', count: stats.byCategory.direct, pct: stats.directPct, color: 'bg-[hsl(var(--others))]' },
            { icon: Briefcase, label: isRTL ? 'العمل' : 'Work', count: stats.byCategory.work, pct: stats.workPct, color: 'bg-[hsl(var(--work))]' },
            { icon: Users, label: isRTL ? 'الدائرة' : 'Audience', count: stats.byCategory.audience, pct: stats.audiencePct, color: 'bg-[hsl(var(--audience))]' },
          ].map((item, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <span className="text-sm font-bold">{item.count} <span className="text-xs text-muted-foreground font-normal">({item.pct}%)</span></span>
              </div>
              <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                <div className={cn('h-full rounded-full transition-all duration-700', item.color)} style={{ width: `${item.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* AI Personality */}
      <Card className="border-primary/15 overflow-hidden" style={{ background: 'var(--gradient-gold-soft)' }}>
        <CardContent className="p-5">
          {analysis ? (
            <div className="space-y-4 animate-fade-in-up">
              <div className="text-center p-5 bg-card rounded-2xl border border-primary/15">
                <p className="text-xl font-bold mb-2">{analysis.type}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{analysis.description}</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {analysis.traits.map((t, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-full bg-primary/10 text-primary font-semibold text-xs border border-primary/15">
                    {t}
                  </span>
                ))}
              </div>
              {/* Honest advice */}
              <div className="p-4 bg-primary/5 rounded-xl">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm leading-relaxed font-medium">{analysis.advice}</p>
                </div>
              </div>
              {/* Psychological insight */}
              {analysis.insight && (
                <div className="p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-start gap-2">
                    <Brain className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground leading-relaxed italic">{analysis.insight}</p>
                  </div>
                </div>
              )}
              <Button
                variant="ghost"
                onClick={() => { setAnalysis(null); analyzePersonality(); }}
                className="w-full text-sm text-muted-foreground"
              >
                {isRTL ? '🔄 تحليل جديد' : '🔄 New Analysis'}
              </Button>
            </div>
          ) : (
            <div className="text-center py-4">
              <Brain className="h-8 w-8 text-primary mx-auto mb-3 animate-crown" />
              <p className="text-sm text-muted-foreground mb-4">
                {isRTL ? 'اكتشف شخصيتك الحقيقية بناءً على تواصلك' : 'Discover your true personality from your communication'}
              </p>
              <Button
                onClick={analyzePersonality}
                disabled={isAnalyzing}
                size="lg"
                className="h-13 px-8 text-base rounded-2xl touch-feedback"
              >
                {isAnalyzing ? (
                  <><Loader2 className="h-5 w-5 animate-spin me-2" />{isRTL ? 'جاري التحليل...' : 'Analyzing...'}</>
                ) : (
                  <><Sparkles className="h-5 w-5 me-2" />{isRTL ? 'اكتشف' : 'Discover'}</>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
