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
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { TrendingUp, Mail, Send, Clock, Briefcase, Users, Heart } from 'lucide-react';
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

export default function CommunicationPatterns({ userId }: CommunicationPatternsProps) {
  const { isRTL } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [isLoading, setIsLoading] = useState(true);

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

    return {
      totalReceived: received.length,
      totalSent: sent.length,
      byCategoryReceived,
      byCategorySent,
      mostActiveHour: parseInt(mostActiveHour),
    };
  }, [messages, userId]);

  // Chart data
  const pieData = [
    { name: isRTL ? 'العمل' : 'Work', value: stats.byCategoryReceived.work, color: 'hsl(222, 50%, 35%)' },
    { name: isRTL ? 'الجمهور' : 'Audience', value: stats.byCategoryReceived.audience, color: 'hsl(172, 60%, 42%)' },
    { name: isRTL ? 'مباشر' : 'Direct', value: stats.byCategoryReceived.direct, color: 'hsl(24, 95%, 58%)' },
  ];

  const barData = [
    { 
      name: isRTL ? 'العمل' : 'Work', 
      received: stats.byCategoryReceived.work, 
      sent: stats.byCategorySent.work,
    },
    { 
      name: isRTL ? 'الجمهور' : 'Audience', 
      received: stats.byCategoryReceived.audience, 
      sent: stats.byCategorySent.audience,
    },
    { 
      name: isRTL ? 'مباشر' : 'Direct', 
      received: stats.byCategoryReceived.direct, 
      sent: stats.byCategorySent.direct,
    },
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
        date: date.toLocaleDateString(isRTL ? 'ar' : 'en', { weekday: 'short', day: 'numeric' }),
        received,
        sent,
      });
    }
    
    return data;
  }, [messages, userId, period, isRTL]);

  const chartConfig = {
    received: {
      label: isRTL ? 'مستلمة' : 'Received',
      color: 'hsl(var(--primary))',
    },
    sent: {
      label: isRTL ? 'مرسلة' : 'Sent',
      color: 'hsl(var(--accent))',
    },
  };

  const formatHour = (hour: number) => {
    if (isRTL) {
      return hour < 12 ? `${hour} صباحاً` : `${hour - 12 || 12} مساءً`;
    }
    return hour < 12 ? `${hour} AM` : `${hour - 12 || 12} PM`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          {isRTL ? 'نمط التواصل' : 'Communication Pattern'}
        </h2>
        <Select value={period} onValueChange={(v: 'week' | 'month') => setPeriod(v)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">{isRTL ? 'أسبوع' : 'Week'}</SelectItem>
            <SelectItem value="month">{isRTL ? 'شهر' : 'Month'}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">
              {isRTL ? 'مستلمة' : 'Received'}
            </span>
          </div>
          <p className="text-xl font-bold mt-1">{stats.totalReceived}</p>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4 text-accent" />
            <span className="text-xs text-muted-foreground">
              {isRTL ? 'مرسلة' : 'Sent'}
            </span>
          </div>
          <p className="text-xl font-bold mt-1">{stats.totalSent}</p>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {isRTL ? 'أكثر نشاطاً' : 'Most Active'}
            </span>
          </div>
          <p className="text-lg font-bold mt-1">{formatHour(stats.mostActiveHour)}</p>
        </Card>
      </div>

      {/* Activity chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            {isRTL ? 'النشاط اليومي' : 'Daily Activity'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-48">
            <AreaChart data={dailyData}>
              <defs>
                <linearGradient id="fillReceived" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="fillSent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} width={30} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="received"
                stroke="hsl(var(--primary))"
                fill="url(#fillReceived)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="sent"
                stroke="hsl(var(--accent))"
                fill="url(#fillSent)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Category breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            {isRTL ? 'توزيع الفئات' : 'Category Distribution'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {/* Pie chart */}
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={50}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legend */}
            <div className="flex flex-col justify-center gap-2">
              {pieData.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs">{item.name}</span>
                  <span className="text-xs text-muted-foreground ms-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
