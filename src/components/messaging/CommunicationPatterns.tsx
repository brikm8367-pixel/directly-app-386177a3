import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Crown, Mail, Send, Clock, Briefcase, Users, Heart, Sparkles, Brain, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Message {
  id: string;
  category: 'work' | 'audience' | 'direct';
  created_at: string;
  sender_id: string;
  receiver_id: string;
}

interface CommunicationPatternsProps {
  userId: string;
}

interface PersonalityAnalysis {
  type: string;
  description: string;
  traits: string[];
  advice: string;
}

export default function CommunicationPatterns({ userId }: CommunicationPatternsProps) {
  const { isRTL } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [period, setPeriod] = useState<'week' | 'month'>('month');
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [personalityAnalysis, setPersonalityAnalysis] = useState<PersonalityAnalysis | null>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      setIsLoading(true);
      const daysAgo = period === 'week' ? 7 : 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      const { data: received } = await supabase
        .from('messages')
        .select('id, category, created_at, sender_id, receiver_id')
        .eq('receiver_id', userId)
        .gte('created_at', startDate.toISOString());

      const { data: sent } = await supabase
        .from('messages')
        .select('id, category, created_at, sender_id, receiver_id')
        .eq('sender_id', userId)
        .gte('created_at', startDate.toISOString());

      setMessages([...(received || []), ...(sent || [])] as Message[]);
      setIsLoading(false);
    };

    if (userId) fetchMessages();
  }, [userId, period]);

  const stats = useMemo(() => {
    const received = messages.filter(m => m.receiver_id === userId);
    const sent = messages.filter(m => m.sender_id === userId);

    const byCategoryReceived = {
      work: received.filter(m => m.category === 'work').length,
      audience: received.filter(m => m.category === 'audience').length,
      direct: received.filter(m => m.category === 'direct').length,
    };

    const hourCounts: Record<number, number> = {};
    received.forEach(m => {
      const hour = new Date(m.created_at).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    const mostActiveHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '12';

    const totalReceived = received.length;
    const totalSent = sent.length;
    const responseRate = totalReceived > 0 ? Math.round(totalSent / totalReceived * 100) : 0;
    const workRatio = totalReceived > 0 ? Math.round(byCategoryReceived.work / totalReceived * 100) : 0;
    const directRatio = totalReceived > 0 ? Math.round(byCategoryReceived.direct / totalReceived * 100) : 0;
    const audienceRatio = totalReceived > 0 ? Math.round(byCategoryReceived.audience / totalReceived * 100) : 0;

    return {
      totalReceived,
      totalSent,
      byCategoryReceived,
      mostActiveHour: parseInt(mostActiveHour),
      responseRate,
      workRatio,
      directRatio,
      audienceRatio,
    };
  }, [messages, userId]);

  // Real AI-powered personality analysis
  const analyzePersonality = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-personality', {
        body: {
          stats: {
            totalReceived: stats.totalReceived,
            totalSent: stats.totalSent,
            workCount: stats.byCategoryReceived.work,
            audienceCount: stats.byCategoryReceived.audience,
            directCount: stats.byCategoryReceived.direct,
            workRatio: stats.workRatio,
            audienceRatio: stats.audienceRatio,
            directRatio: stats.directRatio,
            responseRate: stats.responseRate,
            mostActiveHour: stats.mostActiveHour,
            period,
          },
          language: isRTL ? 'ar' : 'en',
        },
      });

      if (error) throw error;
      
      if (data?.error && !data?.type) {
        toast.error(isRTL ? 'تعذر التحليل، حاول لاحقاً' : 'Analysis unavailable, try later');
      } else {
        setPersonalityAnalysis(data as PersonalityAnalysis);
      }
    } catch (error) {
      console.error('Personality analysis error:', error);
      toast.error(isRTL ? 'تعذر التحليل' : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Bar chart data
  const barData = useMemo(() => {
    const days = period === 'week' ? 7 : 14;
    const data: { day: string; work: number; audience: number; direct: number }[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayNames = isRTL 
        ? ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت']
        : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      data.push({
        day: period === 'week' ? dayNames[date.getDay()] : date.getDate().toString(),
        work: messages.filter(m => m.receiver_id === userId && m.category === 'work' && m.created_at.startsWith(dateStr)).length,
        audience: messages.filter(m => m.receiver_id === userId && m.category === 'audience' && m.created_at.startsWith(dateStr)).length,
        direct: messages.filter(m => m.receiver_id === userId && m.category === 'direct' && m.created_at.startsWith(dateStr)).length,
      });
    }
    return data;
  }, [messages, userId, period, isRTL]);

  const formatHour = (hour: number) => {
    if (isRTL) return hour < 12 ? `${hour || 12} ص` : `${hour - 12 || 12} م`;
    return hour < 12 ? `${hour || 12} AM` : `${hour - 12 || 12} PM`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    return (
      <div className="bg-card border border-border rounded-xl p-3 shadow-lg text-sm">
        <p className="font-semibold mb-1">{label}</p>
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="relative">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
          <Crown className="h-5 w-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-lg text-muted-foreground">{isRTL ? 'جاري التحليل...' : 'Analyzing...'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-primary/10 animate-gold-glow">
            <Crown className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-xl">{isRTL ? 'نمط التواصل' : 'Your Pattern'}</h2>
            <p className="text-sm text-muted-foreground">{isRTL ? 'تحليل ديناميكي حقيقي' : 'Real dynamic analysis'}</p>
          </div>
        </div>
        <Select value={period} onValueChange={(v: 'week' | 'month') => { setPeriod(v); setPersonalityAnalysis(null); }}>
          <SelectTrigger className="w-28 h-12 rounded-xl border-2 border-primary/20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">{isRTL ? 'أسبوع' : 'Week'}</SelectItem>
            <SelectItem value="month">{isRTL ? 'شهر' : 'Month'}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Mail, label: isRTL ? 'مستلمة' : 'Received', value: stats.totalReceived },
          { icon: Send, label: isRTL ? 'مرسلة' : 'Sent', value: stats.totalSent },
          { icon: Clock, label: isRTL ? 'نشاطك' : 'Peak', value: formatHour(stats.mostActiveHour) },
        ].map((item, i) => (
          <Card key={i} className="p-4 border border-primary/10">
            <div className="flex items-center gap-2 mb-2">
              <item.icon className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
            <p className={`font-bold ${typeof item.value === 'number' ? 'text-3xl' : 'text-lg'}`}>{item.value}</p>
          </Card>
        ))}
      </div>

      {/* Bar Chart */}
      <Card className="border border-primary/10 overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {isRTL ? 'نشاطك' : 'Activity'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barCategoryGap="20%">
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} cursor={false} />
                <Bar dataKey="direct" stackId="a" fill="hsl(var(--others))" radius={[0, 0, 0, 0]} name={isRTL ? 'الخاص' : 'Private'} />
                <Bar dataKey="work" stackId="a" fill="hsl(var(--work))" radius={[0, 0, 0, 0]} name={isRTL ? 'العمل' : 'Work'} />
                <Bar dataKey="audience" stackId="a" fill="hsl(var(--audience))" radius={[4, 4, 0, 0]} name={isRTL ? 'الدائرة' : 'Audience'} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-5 mt-3">
            {[
              { color: 'hsl(var(--others))', label: isRTL ? 'الخاص' : 'Private' },
              { color: 'hsl(var(--work))', label: isRTL ? 'العمل' : 'Work' },
              { color: 'hsl(var(--audience))', label: isRTL ? 'الدائرة' : 'Audience' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card className="border border-primary/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            {isRTL ? 'توزيع الرسائل' : 'Distribution'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { icon: Heart, label: isRTL ? 'الخاص' : 'Private', value: stats.byCategoryReceived.direct, color: 'bg-others' },
            { icon: Briefcase, label: isRTL ? 'العمل' : 'Work', value: stats.byCategoryReceived.work, color: 'bg-work' },
            { icon: Users, label: isRTL ? 'الدائرة' : 'Audience', value: stats.byCategoryReceived.audience, color: 'bg-audience' },
          ].map((item, i) => {
            const total = stats.totalReceived || 1;
            const pct = Math.round((item.value / total) * 100);
            return (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <span className="text-sm font-bold text-primary">{item.value} <span className="text-xs text-muted-foreground font-normal">({pct}%)</span></span>
                </div>
                <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full ${item.color} transition-all duration-700`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* AI Personality - Real AI */}
      <Card className="border border-primary/20 overflow-hidden" style={{ background: 'var(--gradient-gold-soft)' }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary animate-crown" />
            {isRTL ? 'تحليل شخصيتك بالذكاء الاصطناعي' : 'AI Personality Analysis'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {personalityAnalysis ? (
            <div className="space-y-4 animate-fade-in-up">
              <div className="text-center p-5 bg-card rounded-2xl border border-primary/20">
                <p className="text-2xl font-bold mb-2">{personalityAnalysis.type}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{personalityAnalysis.description}</p>
              </div>

              <div className="flex flex-wrap gap-2 justify-center">
                {personalityAnalysis.traits.map((trait, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm border border-primary/20">
                    {trait}
                  </span>
                ))}
              </div>

              <div className="p-4 bg-primary/10 rounded-xl border border-primary/20 text-center">
                <p className="text-sm font-medium leading-relaxed">{personalityAnalysis.advice}</p>
              </div>

              <Button
                variant="ghost"
                onClick={() => { setPersonalityAnalysis(null); analyzePersonality(); }}
                className="w-full text-sm text-muted-foreground"
              >
                {isRTL ? '🔄 تحليل جديد' : '🔄 New Analysis'}
              </Button>
            </div>
          ) : (
            <div className="text-center py-5">
              <p className="text-sm text-muted-foreground mb-4">
                {isRTL ? 'اكتشف شخصيتك الحقيقية بناءً على تواصلك' : 'Discover your true personality based on your communication'}
              </p>
              <Button
                onClick={analyzePersonality}
                disabled={isAnalyzing}
                size="lg"
                className="h-14 px-8 text-base rounded-2xl touch-feedback glow-gold"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin me-2" />
                    {isRTL ? 'الذكاء الاصطناعي يحلل...' : 'AI is analyzing...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 me-2" />
                    {isRTL ? '✨ اكتشف شخصيتك' : '✨ Discover Your Type'}
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
