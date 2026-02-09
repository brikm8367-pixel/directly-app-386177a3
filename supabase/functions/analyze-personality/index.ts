import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { stats, language } = await req.json();
    const isArabic = language === 'ar';

    const prompt = `You are a brutally honest communication psychologist. Analyze this user's messaging data and give a TRUTHFUL, data-driven personality assessment. DO NOT flatter or sugarcoat. If the data shows problems, say so directly but respectfully.

DATA:
- Total received: ${stats.totalReceived}
- Total sent: ${stats.totalSent}
- Work messages: ${stats.workCount} (${stats.workRatio}%)
- Audience messages: ${stats.audienceCount} (${stats.audienceRatio}%)
- Private messages: ${stats.directCount} (${stats.directRatio}%)
- Response rate: ${stats.responseRate}%
- Most active hour: ${stats.mostActiveHour}
- Period: ${stats.period}

RESPOND IN ${isArabic ? 'ARABIC' : 'ENGLISH'} with a JSON object (no markdown, just raw JSON):
{
  "type": "An emoji + honest personality title (max 4 words)",
  "description": "2 sentences describing their REAL communication style based on actual data. Be specific and truthful. If they barely message, say so. If they ignore people, say so. If they're balanced, acknowledge it genuinely.",
  "traits": ["trait1", "trait2", "trait3", "trait4"],
  "advice": "One specific, honest, actionable tip based on their actual pattern. Don't just encourage — challenge them if needed. Reference their actual numbers.",
  "insight": "A short, surprising psychological observation about what their pattern reveals about their personality. Be insightful and genuine, not generic."
}

CRITICAL RULES:
- NEVER lie or exaggerate to make the user feel good
- If they have 0 messages, say "you haven't started yet" — don't invent traits
- If their response rate is low, point it out honestly
- If they only use one inbox, note the imbalance
- Be like a wise friend who tells the truth, not a salesperson
- Each analysis must be unique — vary your language every time
- The "insight" should be genuinely thought-provoking`;

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || '';
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const analysis = JSON.parse(content);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-personality:', error);
    return new Response(JSON.stringify({ 
      error: 'Analysis failed',
      type: '🌱 Just Starting',
      description: 'Not enough data yet to provide a meaningful analysis. Keep communicating and come back later.',
      traits: ['New', 'Exploring', 'Growing', 'Open'],
      advice: 'Start by sending a few messages across different inboxes to build your communication profile.',
      insight: 'Every communication journey starts with a single message.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
