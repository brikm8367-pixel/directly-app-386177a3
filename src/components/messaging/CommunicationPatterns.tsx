import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Crown, Mail, Send, Clock, Briefcase, Users, Heart, Sparkles, Brain, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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

  // Calculate stats
  const stats = useMemo(() => {
    const received = messages.filter(m => m.receiver_id === userId);
    const sent = messages.filter(m => m.sender_id === userId);

    const byCategoryReceived = {
      work: received.filter(m => m.category === 'work').length,
      audience: received.filter(m => m.category === 'audience').length,
      direct: received.filter(m => m.category === 'direct').length,
    };

    const byCategorySent = {
      work: sent.filter(m => m.category === 'work').length,
      audience: sent.filter(m => m.category === 'audience').length,
      direct: sent.filter(m => m.category === 'direct').length,
    };

    // Most active hours
    const hourCounts: Record<number, number> = {};
    received.forEach(m => {
      const hour = new Date(m.created_at).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    const mostActiveHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '12';

    // Communication style analysis
    const totalReceived = received.length;
    const totalSent = sent.length;
    const responseRate = totalReceived > 0 ? (totalSent / totalReceived * 100).toFixed(0) : '0';
    const workRatio = totalReceived > 0 ? (byCategoryReceived.work / totalReceived * 100).toFixed(0) : '0';
    const directRatio = totalReceived > 0 ? (byCategoryReceived.direct / totalReceived * 100).toFixed(0) : '0';

    return {
      totalReceived,
      totalSent,
      byCategoryReceived,
      byCategorySent,
      mostActiveHour: parseInt(mostActiveHour),
      responseRate: parseInt(responseRate),
      workRatio: parseInt(workRatio),
      directRatio: parseInt(directRatio),
    };
  }, [messages, userId]);

  // Generate AI personality analysis
  const analyzePersonality = async () => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis based on stats (in production, this would call the AI edge function)
    await new Promise(resolve => setTimeout(resolve, 2000));

    let analysis: PersonalityAnalysis;

    if (stats.workRatio > 60) {
      analysis = {
        type: isRTL ? '🎯 القائد المركّز' : '🎯 Focused Leader',
        description: isRTL 
          ? 'أنت شخص يركز على العمل والإنتاجية. تواصلك مهني ومنظم.'
          : 'You focus on work and productivity. Your communication is professional and organized.',
        traits: isRTL 
          ? ['منظم', 'مهني', 'فعّال', 'موجه نحو الأهداف']
          : ['Organized', 'Professional', 'Efficient', 'Goal-oriented'],
        advice: isRTL
          ? 'نصيحة: خصص وقتاً للتواصل الشخصي لتحقيق التوازن.'
          : 'Tip: Allocate time for personal connections to achieve balance.',
      };
    } else if (stats.directRatio > 40) {
      analysis = {
        type: isRTL ? '💎 الرابط الاجتماعي' : '💎 Social Connector',
        description: isRTL
          ? 'أنت تقدر العلاقات الشخصية العميقة. تواصلك دافئ وأصيل.'
          : 'You value deep personal relationships. Your communication is warm and authentic.',
        traits: isRTL
          ? ['ودود', 'أصيل', 'مخلص', 'داعم']
          : ['Friendly', 'Authentic', 'Loyal', 'Supportive'],
        advice: isRTL
          ? 'نصيحة: استثمر في علاقاتك القريبة فهي مصدر قوتك.'
          : 'Tip: Invest in your close relationships - they are your strength.',
      };
    } else if (stats.responseRate > 80) {
      analysis = {
        type: isRTL ? '⚡ المستجيب السريع' : '⚡ Quick Responder',
        description: isRTL
          ? 'أنت سريع الاستجابة ومتفاعل. الناس يعتمدون عليك.'
          : 'You are responsive and engaged. People rely on you.',
        traits: isRTL
          ? ['سريع', 'موثوق', 'متفاعل', 'مسؤول']
          : ['Fast', 'Reliable', 'Engaged', 'Responsible'],
        advice: isRTL
          ? 'نصيحة: لا تنسَ أن تأخذ وقتاً للتفكير قبل الرد.'
          : 'Tip: Remember to take time to think before responding.',
      };
    } else {
      analysis = {
        type: isRTL ? '🌟 المتوازن الحكيم' : '🌟 Wise Balancer',
        description: isRTL
          ? 'أنت تحافظ على توازن جيد في تواصلك. حكيم في اختياراتك.'
          : 'You maintain good balance in your communication. Wise in your choices.',
        traits: isRTL
          ? ['متوازن', 'حكيم', 'مرن', 'مدرك']
          : ['Balanced', 'Wise', 'Flexible', 'Mindful'],
        advice: isRTL
          ? 'نصيحة: استمر في الحفاظ على هذا التوازن الصحي.'
          : 'Tip: Continue maintaining this healthy balance.',
      };
    }

    setPersonalityAnalysis(analysis);
    setIsAnalyzing(false);
  };

  // Chart data - simplified and clear
  const pieData = [
    { name: isRTL ? 'العمل' : 'Work', value: stats.byCategoryReceived.work, color: '#D4AF37' },
    { name: isRTL ? 'الجمهور' : 'Audience', value: stats.byCategoryReceived.audience, color: '#B8860B' },
    { name: isRTL ? 'مباشر' : 'Direct', value: stats.byCategoryReceived.direct, color: '#FFD700' },
  ];

  // Daily trend data
  const dailyData = useMemo(() => {
    const days = period === 'week' ? 7 : 30;
    const data: { date: string; received: number; sent: number }[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const received = messages.filter(m => 
        m.receiver_id === userId && 
        m.created_at.startsWith(dateStr)
      ).length;
      
      const sent = messages.filter(m => 
        m.sender_id === userId && 
        m.created_at.startsWith(dateStr)
      ).length;
      
      data.push({
        date: date.toLocaleDateString(isRTL ? 'ar' : 'en', { day: 'numeric' }),
        received,
        sent,
      });
    }
    
    return data;
  }, [messages, userId, period, isRTL]);

  const chartConfig = {
    received: {
      label: isRTL ? 'مستلمة' : 'Received',
      color: '#D4AF37',
    },
    sent: {
      label: isRTL ? 'مرسلة' : 'Sent',
      color: '#FFD700',
    },
  };

  const formatHour = (hour: number) => {
    if (isRTL) {
      return hour < 12 ? `${hour || 12} ص` : `${hour - 12 || 12} م`;
    }
    return hour < 12 ? `${hour || 12} AM` : `${hour - 12 || 12} PM`;
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
      {/* Header with Period selector */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-primary/10 animate-gold-glow">
            <Crown className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-xl text-foreground">
              {isRTL ? 'نمط التواصل' : 'Your Pattern'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isRTL ? 'تحليل شخصيتك الشهري' : 'Monthly personality analysis'}
            </p>
          </div>
        </div>
        <Select value={period} onValueChange={(v: 'week' | 'month') => setPeriod(v)}>
          <SelectTrigger className="w-28 h-12 rounded-xl border-2 border-primary/20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">{isRTL ? 'أسبوع' : 'Week'}</SelectItem>
            <SelectItem value="month">{isRTL ? 'شهر' : 'Month'}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quick Stats - Simple and clear */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 border-2 border-primary/10 bg-gradient-to-br from-card to-primary/5">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">
              {isRTL ? 'مستلمة' : 'Received'}
            </span>
          </div>
          <p className="text-3xl font-bold text-foreground">{stats.totalReceived}</p>
        </Card>
        <Card className="p-4 border-2 border-primary/10 bg-gradient-to-br from-card to-primary/5">
          <div className="flex items-center gap-2 mb-2">
            <Send className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">
              {isRTL ? 'مرسلة' : 'Sent'}
            </span>
          </div>
          <p className="text-3xl font-bold text-foreground">{stats.totalSent}</p>
        </Card>
        <Card className="p-4 border-2 border-primary/10 bg-gradient-to-br from-card to-primary/5">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">
              {isRTL ? 'نشاطك' : 'Peak'}
            </span>
          </div>
          <p className="text-xl font-bold text-foreground">{formatHour(stats.mostActiveHour)}</p>
        </Card>
      </div>

      {/* Simple Activity Timeline */}
      <Card className="border-2 border-primary/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {isRTL ? 'خط النشاط' : 'Activity Timeline'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-44">
            <AreaChart data={dailyData}>
              <defs>
                <linearGradient id="fillReceived" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="fillSent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FFD700" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#FFD700" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} width={28} axisLine={false} tickLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="received"
                stroke="#D4AF37"
                fill="url(#fillReceived)"
                strokeWidth={3}
              />
              <Area
                type="monotone"
                dataKey="sent"
                stroke="#FFD700"
                fill="url(#fillSent)"
                strokeWidth={3}
              />
            </AreaChart>
          </ChartContainer>
          <div className="flex justify-center gap-6 mt-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 rounded-full bg-[#D4AF37]" />
              <span className="text-sm text-muted-foreground">{isRTL ? 'مستلمة' : 'Received'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 rounded-full bg-[#FFD700]" />
              <span className="text-sm text-muted-foreground">{isRTL ? 'مرسلة' : 'Sent'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown - Simple pie chart */}
      <Card className="border-2 border-primary/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            {isRTL ? 'توزيع الرسائل' : 'Message Distribution'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            {/* Pie chart */}
            <div className="h-36 w-36 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={55}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legend - Clearer */}
            <div className="flex flex-col gap-4 flex-1">
              {pieData.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full shadow-sm" 
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {i === 0 && <Briefcase className="h-4 w-4 text-muted-foreground" />}
                      {i === 1 && <Users className="h-4 w-4 text-muted-foreground" />}
                      {i === 2 && <Heart className="h-4 w-4 text-muted-foreground" />}
                      <span className="font-medium">{item.name}</span>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-primary">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Personality Analysis */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-card overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary animate-crown" />
            {isRTL ? 'تحليل شخصيتك الشهري' : 'Monthly Personality Analysis'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {personalityAnalysis ? (
            <div className="space-y-4 animate-fade-in-up">
              {/* Personality Type */}
              <div className="text-center p-6 bg-card rounded-2xl border-2 border-primary/20 shadow-md">
                <p className="text-3xl font-bold mb-2">{personalityAnalysis.type}</p>
                <p className="text-muted-foreground">{personalityAnalysis.description}</p>
              </div>

              {/* Traits */}
              <div className="flex flex-wrap gap-2 justify-center">
                {personalityAnalysis.traits.map((trait, i) => (
                  <span 
                    key={i} 
                    className="px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm border border-primary/20"
                  >
                    {trait}
                  </span>
                ))}
              </div>

              {/* Advice */}
              <div className="p-4 bg-primary/10 rounded-xl border border-primary/20 text-center">
                <p className="font-medium text-foreground">{personalityAnalysis.advice}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">
                {isRTL 
                  ? 'اكتشف نمط شخصيتك بناءً على تواصلك هذا الشهر'
                  : 'Discover your personality type based on this month\'s communication'}
              </p>
              <Button 
                onClick={analyzePersonality} 
                disabled={isAnalyzing}
                size="lg"
                className="h-14 px-8 text-lg rounded-2xl touch-feedback glow-gold"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin me-2" />
                    {isRTL ? 'جاري التحليل...' : 'Analyzing...'}
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